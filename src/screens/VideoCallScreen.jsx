import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Button, Text, TextInput, FlatList, StyleSheet, AppState, Platform, Animated, ScrollView } from 'react-native';
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices, RTCView } from 'react-native-webrtc';
import io from 'socket.io-client';
import notifee, { AndroidImportance } from '@notifee/react-native';
import InCallManager from 'react-native-incall-manager';
import DraggableView from '../components/DraggableView';

// Replace with your signaling server address
const SOCKET_SERVER_URL = 'http://172.20.1.194:3000/';
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const VideoCallScreen = () => {
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const appState = useRef(AppState.currentState);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true); // Video call: video enabled by default
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Monitor app state changes to know if the app is active
  useEffect(() => {
    // fetch(SOCKET_SERVER_URL).then(res=>res.json()).then(res=>console.log('res',res))
    const subscription = AppState.addEventListener('change', nextState => {
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  // Setup the Socket.io connection and event listeners
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ['websocket'], // Force WebSocket transport
        reconnectionAttempts: 5, // Retry 5 times
        timeout: 5000, // 5 seconds timeout
      })
    socketRef.current.connect();
    socketRef.current.emit('join', 'room1'); // For demo, a fixed room

    socketRef.current.on('offer', async (data) => {
      console.log('Received offer:', data);
      // If app is not active, display an incoming call notification
      if (appState.current !== 'active') {
        await displayCallNotification(data.from || 'Unknown Caller');
      }
      await createPeerConnection();
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketRef.current.emit('answer', { room: 'room1', answer });
        setIsCalling(true);
      }
    });

    socketRef.current.on('answer', async (data) => {
      console.log('Received answer:', data);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
      setIsCalling(true);
    });

    socketRef.current.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate:', data);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.log('Error adding ICE candidate', error);
        }
      }
    });

    socketRef.current.on('chat-message', (data) => {
      console.log('Received chat message:', data);
      const newMessage = { id: Date.now().toString(), text: data.message, sender: data.sender };
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, []);

  // Use Notifee to display a notification for an incoming call when the app is in background
  const displayCallNotification = async (caller) => {
    const channelId = await notifee.createChannel({
      id: 'calls',
      name: 'Call Notifications',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: 'Incoming Call',
      body: `Call from ${caller}`,
      android: {
        channelId,
        smallIcon: 'ic_launcher', // ensure this icon exists in your project
        fullScreenAction: { id: 'default' },
      },
      ios: { sound: 'default' },
    });
  };

  // Create the RTCPeerConnection and get the local media stream based on toggle settings
  const createPeerConnection = async () => {
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    const stream = await mediaDevices.getUserMedia({
      audio: isAudioEnabled,
      video: isVideoEnabled,
    });
    setLocalStream(stream);

    // Set speakerphone on
    setTimeout(() => {
      InCallManager.start({ media: 'audio' }); // Ensure InCallManager is started
      InCallManager.setForceSpeakerphoneOn(true); // Try forcing speaker
      InCallManager.setSpeakerphoneOn(true);  // Turns on speaker
    }, 1000);

    // Add all tracks to the peer connection
    stream.getTracks().forEach(track => {
      peerConnectionRef.current.addTrack(track, stream);
    });

    // Relay ICE candidates to the signaling server
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { room: 'room1', candidate: event.candidate });
      }
    };

    // When a remote stream is received, set it in state
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Remote track received', event);
      if (event.streams?.length > 0) {
        setRemoteStream(event.streams);
      }
    };
  };

  // Start the video call by creating an offer and sending it via signaling
  const startCall = async () => {
    await createPeerConnection();
    if (peerConnectionRef.current) {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit('offer', { room: 'room1', offer });
    }
  };

  // Chat message sending function
  const sendChatMessage = () => {
    if (chatInput.trim() !== '') {
      const messageData = { room: 'room1', message: chatInput, sender: 'User' };
      socketRef.current.emit('chat-message', messageData);
      const newMessage = { id: Date.now().toString(), text: chatInput, sender: 'Me' };
      setMessages(prev => [...prev, newMessage]);
      setChatInput('');
    }
  };
  const endCall = () => {
    // if (peerConnectionRef.current) {
    //   peerConnectionRef.current.close();
    //   peerConnectionRef.current = null;
    // }
    // if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    //   setLocalStream(null);
    // }
    // if (remoteStream) {
    //   remoteStream.getTracks().forEach(track => track.stop());
    //   setRemoteStream(null);
    // }
    // socketRef.current.emit('end-call', { room: 'room1' });
    // setIsCalling(false);
  };
  
  // Toggle audio on/off and update any existing tracks
  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = newState));
    }
  };

  // Toggle video on/off and update any existing tracks
  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    if (localStream) {
      localStream.getVideoTracks().forEach(track => (track.enabled = newState));
    }
  };
  
const toggleCamera = async () => {
  if (!localStream) return;
  localStream.getVideoTracks()[0]?.applyConstraints({ facingMode: isFrontCamera ? 'environment' : 'user' });
  setIsFrontCamera(!isFrontCamera);
};

  // New function for Screen Sharing
  const startScreenShare = async () => {
    try {
      // IMPORTANT: React Native does not have a built-in getDisplayMedia function.
      // You must implement native modules (using ReplayKit for iOS or MediaProjection API for Android)
      // or use a third-party library that supports screen capture.
      // The following call is a placeholder to illustrate the flow:
      const screenStream = await mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      // Optionally, you could create a new peer connection for screen share or add the stream to the existing connection.
      // Here we assume you add the screenStream tracks to your existing peer connection.
      setLocalStream(screenStream);
      screenStream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, screenStream);
      });
      // Emit a custom socket event to signal that screen sharing is active.
      socketRef.current.emit('screenshare', { room: 'room1', offer: 'Screen share offer placeholder' });
      console.log('Screen sharing started');
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };
  const renderMessageItem = ({ item }) => (
    <View style={styles.messageItem}>
      <Text style={styles.messageSender}>{item.sender}:</Text>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      {/* Video Call Section */}
      <View style={styles.videoContainer}>
      {/* <ScrollView> */}
        {remoteStream?.length > 0 ? remoteStream.map((stream, index) =>(
          <View key={stream.toURL()} style={styles.remoteVideo} >
            <RTCView  
              zOrder={10}
              streamURL={stream ? stream.toURL() : null} 
              style={{
                flex:1,
                borderRadius:6,
                pointerEvents: 'none', 
                overflow: 'visible',
                objectFit: 'cover', // Prevents cropping
              }}  
              objectFit='cover' />
          </View>
        )) : (
          <View style={styles.remoteVideoPlaceholder}>
            <Text allowFontScaling={false} style={{ color: 'white' }}>Waiting for remote stream...</Text>
          </View>
        )}
         
         {localStream && (
          <DraggableView style={styles.localVideo}>
            <RTCView  
              zOrder={20}
              key={localStream.toURL()}
              streamURL={isVideoEnabled ? localStream.toURL() : null}  
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
              }}  
              objectFit="cover" 
            />
          </DraggableView>
        )}
      {/* </ScrollView> */}
      </View>

      {/* Call Controls */}
      <ScrollView horizontal style={styles.controlsContainer}>
        {/* <Text allowFontScaling={false} style={{marginHorizontal:10,fontWeight:'600',color:'#125D98'}} onPress={isCalling ? endCall : startCall}>{isCalling ? "End Call" : "Start Call"}</Text> */}
        <Text allowFontScaling={false} style={{marginHorizontal:10,fontWeight:'600',color:'#125D98'}} onPress={startCall} disabled={isCalling}>{isCalling ? "In Call" : "Start Call"}</Text>
        <Text allowFontScaling={false} style={{marginHorizontal:10,fontWeight:'600',color:'#125D98'}} onPress={toggleAudio}>{`Audio ${isAudioEnabled ? 'On' : 'Off'}`}</Text>
        <Text allowFontScaling={false} style={{marginHorizontal:10,fontWeight:'600',color:'#125D98'}} onPress={toggleVideo}>{`Video ${isVideoEnabled ? 'On' : 'Off'}`}</Text>
        <Text allowFontScaling={false} style={{marginHorizontal:10,fontWeight:'600',color:'#125D98'}} onPress={toggleCamera}>{`${isFrontCamera ? 'Front' : 'Back'}`}</Text>
        {/* New Control for Screen Share */}
        <Text allowFontScaling={false} style={{ marginHorizontal: 10, fontWeight: '600', color: '#125D98' }} onPress={startScreenShare}>
          Share Screen
        </Text>
      </ScrollView>

      {/* Chat Section */}
      <View style={styles.chatContainer}>
        <FlatList data={messages} renderItem={renderMessageItem} keyExtractor={(item) => item.id} />
        <View style={styles.chatInputContainer}>
          <TextInput
            allowFontScaling={false}
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder={"Type a message..."}
            placeholderTextColor={'#ccc'}
          />
          <Text allowFontScaling={false} style={{marginHorizontal:10,fontWeight:'700',color:'#125D98',fontSize:16}} onPress={sendChatMessage}>Send</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 2,
    backgroundColor: '#000',
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  localVideo: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 100,
    height: 140,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
    zIndex: 10, // Ensures it is above remote video
    elevation: 10, // Works for Android to bring it on top
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Prevents transparency issue
    overflow: 'hidden',
  },
  controlsContainer: {
    padding: 10,
    backgroundColor: '#ccc',
    gap:5,
    flexGrow: 0
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
  },
  messageItem: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  messageSender: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  messageText: {
    flex: 1,
  },
});

export default VideoCallScreen;
