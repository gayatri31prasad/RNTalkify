import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Button, Text, TextInput, FlatList, StyleSheet, AppState, Platform } from 'react-native';
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices, RTCView } from 'react-native-webrtc';
import io from 'socket.io-client';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Replace with your signaling server address
const SOCKET_SERVER_URL = 'http://localhost:3000/';
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

  // Monitor app state changes to know if the app is active
  useEffect(() => {
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
          console.error('Error adding ICE candidate', error);
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
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
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
        {remoteStream ? (
          <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} />
        ) : (
          <View style={styles.remoteVideoPlaceholder}>
            <Text style={{ color: 'white' }}>Waiting for remote stream...</Text>
          </View>
        )}
        {localStream && (
          <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <Button title={isCalling ? "In Call" : "Start Call"} onPress={startCall} disabled={isCalling} />
        <Button title={`Audio ${isAudioEnabled ? 'On' : 'Off'}`} onPress={toggleAudio} />
        <Button title={`Video ${isVideoEnabled ? 'On' : 'Off'}`} onPress={toggleVideo} />
      </View>

      {/* Chat Section */}
      <View style={styles.chatContainer}>
        <FlatList data={messages} renderItem={renderMessageItem} keyExtractor={(item) => item.id} />
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Type a message..."
          />
          <Button title="Send" onPress={sendChatMessage} />
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
    width: 120,
    height: 160,
    position: 'absolute',
    top: 10,
    right: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#222',
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
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 40,
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
