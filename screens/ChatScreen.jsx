// screens/ChatScreen.js
import moment from 'moment';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, Text, TextInput, Button, FlatList, StyleSheet, View, TouchableOpacity, Image } from 'react-native';

export default function ChatScreen({ route }) {
  const { username, roomId, roomName } = route.params;
  // console.log({ roomId, username, roomName });
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  let todaysDate = moment().format('DD-MMM-YYYY')
  // WebSocket URL
  const SOCKET_URL = `https://chat-api-k4vi.onrender.com/ws/${roomId}/${username}`; // Use 'wss://' if required
  // const SOCKET_URL = `https://chat-api-k4vi.onrender.com/ws/82329acf-5080-45df-81ad-28b2c4dff898/Prem`; // Use 'wss://' if required
  
  useEffect(() => {
    fetch(`https://chat-api-k4vi.onrender.com/chat/rooms/${roomId}/messages`)
    .then(response => response.json())
    .then(message => setMessages(message?.reverse()))
    .catch(error => console.error('Error fetching messages:', error));
    console.log('socket ',SOCKET_URL)
    socketRef.current = new WebSocket(SOCKET_URL);
    // console.log("WebSocket URL:", socketRef.current);

    socketRef.current.onopen = () => {
      console.log('Connected to the WebSocket server');
    };

    socketRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        if(message.event == 'message'){
          setMessages((prevMessages) => [...prevMessages, message?.message]);
        }else{
          
          // setMessages((prevMessages) => [...prevMessages, message]);
        }
      } catch (error) {
        console.error("Error parsing message:", error, "Received data:", event.data);
      }
    };
    socketRef.current.onclose = (e) => {
      console.log("Disconnected from the WebSocket server", e);
    };
    socketRef.current.onerror = (errorEvent) => {
      try {
        console.error("WebSocket error:", errorEvent);
        // Additional error processing here
      } catch (e) {
        console.error("Error while handling WebSocket error:", e);
      }
    };
    setTimeout(()=>scrollToBottom(),1000)
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        console.log("WebSocket closed");
      }
    };
  }, []);

  const sendMessage = () => {
    if (socketRef.current && inputMessage.trim()) {
      const messagePayload = {
        event: "message",
        content: inputMessage.trim(),
      };
      socketRef.current.send(JSON.stringify(messagePayload));
      setInputMessage('');
    }
  };
  
  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str?.length; i++) {
      hash = str?.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += value?.toString(16)?.padStart(2, "0");
    }
    return color;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text allowFontScaling={false} style={{ fontSize: 20,fontWeight:'500',color:'#000' }}>Room: <Text allowFontScaling={false} style={{color:'#FF8000',fontWeight:'700',fontSize:22}}>{roomName}</Text></Text>
      <FlatList
        style={styles.chatList}
        data={messages}
        ref={flatListRef}
        showsVerticalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          let NDate = moment(item?.created_at).format('DD-MMM-YYYY')
          let boolean = todaysDate != NDate
          todaysDate = NDate
          let selfStyle = {alignSelf:item?.username === username ? 'flex-end' : 'flex-start',backgroundColor:item?.username === username ? '#9ED5C5' : '#eee',}
          return(<>
          {boolean && 
            <View style={{marginTop:5,paddingHorizontal:10,paddingVertical:2,alignSelf:'center',backgroundColor:'#FF800099',borderRadius:12}}>
              <Text style={{color:'#fff',fontSize:12,fontWeight:'500'}}>
                {todaysDate}
              </Text>
            </View>}
          <View style={{flexDirection:'row',gap:2,width:'100%'}}>
            <Image source={{uri:`https://avatar.iran.liara.run/public/boy?username=${item?.username}.png`}} alt='GroupImage' style={{ width: 20, height: 20,backgroundColor:'#ccc',borderRadius:100 }} />
            <View style={{ marginBottom: 8,paddingVertical:4,paddingHorizontal:6,borderRadius:10, maxWidth:'80%',...selfStyle }}>
              <Text allowFontScaling={false} style={{fontSize:12,fontWeight:'500',textTransform:'capitalize',borderBottomWidth:1,borderColor:'#ccc',color:stringToColor(item?.username)}}>{item?.username ? `${item?.username} ` : ''}</Text>
              <Text allowFontScaling={false} style={{fontSize:14,fontWeight:'500',padding:6}}>
                {item.content}
              </Text>
              <Text allowFontScaling={false} style={{alignSelf:'flex-end',fontSize:12}}>{moment(item.created_at).format('h:mm a')}</Text>
            </View>
          </View>
        </>
        )}}
        ListEmptyComponent={()=>(<>
        <Text style={{fontSize:16,alignSelf:'center'}}> No chats avalable</Text>
        </>)}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
        <TextInput
          style={[styles.input,{flex:1} ]}
          placeholder="Type your message..."
          value={inputMessage}
          multiline={true}
          onChangeText={setInputMessage}
          />
        {/* <Button title="Send" onPress={sendMessage} /> */}
        <TouchableOpacity style={{ backgroundColor: '#FF8000', padding: 8, borderRadius: 6}} onPress={sendMessage}>
          <Text  allowFontScaling={false} style={{fontSize:14,fontWeight:'600',color:'#fff',textAlign:'center'}}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  chatList: { flex: 1, marginVertical: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 4, borderRadius: 4 },
});

