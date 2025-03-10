// screens/CreateRoomScreen.js
import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function CreateRoomScreen({ route, navigation }) {
  const { username } = route.params;
  const [roomName, setRoomName] = useState('');

  const handleCreateRoom = async () => {
    if (roomName.trim()) {
      try {
        const response = await fetch('https://chat-api-k4vi.onrender.com/chat/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: roomName })
        });
        const newRoom = await response.json();
        console.log('newRoom:- ',newRoom)
        if(newRoom?.detail == 'Room with this name already exists'){
          Alert.alert('The room name already exists.');
          return
        }
        navigation.goBack();
        navigation.navigate('Chat', {
          username,
          roomId: newRoom.id,
          roomName: newRoom.name
        });
      } catch (error) {
        console.error('Error creating room:', error);
      }
    }else{
      Alert.alert('Error', 'Please enter a valid room name.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text allowFontScaling={false} style={{ fontSize: 16,marginBottom:4,marginTop:20 }}>Enter New Room Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Room Name"
        value={roomName}
        onChangeText={setRoomName}
      />
      {/* <Button title="Create Room" onPress={handleCreateRoom} /> */}
      <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#FF8000', padding: 8, borderRadius: 4}} onPress={handleCreateRoom}>
        <Text  allowFontScaling={false} style={{fontSize:16,fontWeight:'600',color:'#fff',textAlign:'center'}}>Create Room</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 }
});
