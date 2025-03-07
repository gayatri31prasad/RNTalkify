// screens/RoomsScreen.js
import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, FlatList, TouchableOpacity, Button, StyleSheet, View, Image } from 'react-native';

export default function RoomsScreen({ route, navigation }) {
  const { username } = route.params;
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const response = await fetch('https://chat-api-k4vi.onrender.com/chat/rooms');
        const data = await response.json();
        const newData = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        setRooms(newData);
        // console.log('room data: ',data)
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    }
    fetchRooms();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text allowFontScaling={false} style={styles.title}>Welcome,  <Text style={{color:'#FF8000',fontWeight:'700',fontSize:22}}>{username}!</Text></Text>
      <Text allowFontScaling={false} style={styles.subtitle}>Available Chat Rooms:</Text>
      <FlatList
        data={rooms}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee',flexDirection:'row',gap:10 }}
            onPress={() =>
              navigation.navigate('Chat', {
                username,
                roomId: item.id,
                roomName: item.name
              })
            }
          >
            <Image source={{uri:`https://avatar.iran.liara.run/public/boy?username=${item.name}.png`}} alt='GroupImage' style={{ width: 50, height: 50,backgroundColor:'#ccc',borderRadius:100 }} />
            <View style={{flex:1,justifyContent:'space-between'}}>
              <Text allowFontScaling={false} style={{ fontSize: 16,fontWeight:'600',}}>{item.name}</Text>
              <Text allowFontScaling={false} style={{ fontSize: 12,alignSelf:'flex-end'}}>created on: {moment(item.created_at).format('DD-MMM-YYYY')}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <Button
        title="Create New Room"
        onPress={() => navigation.navigate('CreateRoom', { username })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20,color:'#000' },
  subtitle: { fontSize: 16, marginVertical: 8 },
});
