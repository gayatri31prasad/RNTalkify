// screens/LoginScreen.js
import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, StyleSheet, View, TouchableOpacity } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    if (username.trim()) {
      // Optionally, call an API to register the user.
      const body = JSON.stringify({ username:username.replaceAll(' ', '_') })
      fetch('https://chat-api-k4vi.onrender.com/chat/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      .then(res=>res.json())
      .then(res=>{
        console.log('then',res)
        navigation.navigate('Rooms', {  username  });
        setUsername('')
      })
        .catch(err=>console.log('err',err))
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text allowFontScaling={false} style={{fontSize:34,fontWeight:'700',color:'#FF8000',marginTop:-100,marginBottom:40,alignSelf:'center'}}>Welcome to Talkify</Text>
      <View style={{width:'100%',paddingHorizontal:10}}>
        <Text  allowFontScaling={false} style={{ fontSize: 16,marginBottom:4 }}>Enter Username:</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          />
        {/* <Button title="Set Username"   /> */}
        <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#FF8000', padding: 8, borderRadius: 4}} onPress={handleLogin}>
          <Text  allowFontScaling={false} style={{fontSize:16,fontWeight:'600',color:'#fff',textAlign:'center'}}>Set Username</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent:'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8,  borderRadius: 4,width:'100%' }
});
