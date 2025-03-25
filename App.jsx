// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import LoginScreen from './src/screens/LoginScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import CreateRoomScreen from './src/screens/CreateRoomScreen';
import ChatScreen from './src/screens/ChatScreen';
import VideoCallScreen from './src/screens/VideoCallScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{}} initialRouteName="Login">
        {/* <Stack.Screen options={{headerShown: false}} name="Login" component={VideoCallScreen} /> */}
        <Stack.Screen options={{headerShown: false}} name="Login" component={LoginScreen} />
        <Stack.Screen options={{ title: 'Available Chat Rooms'}} name="Rooms" component={RoomsScreen} />
        <Stack.Screen options={{ title: 'Create a New Room'}} name="CreateRoom" component={CreateRoomScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
