import React, { useRef, useState } from 'react';
import { View, Animated, PanResponder, Dimensions } from 'react-native';

const DraggableView = (props) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [lastPosition, setLastPosition] = useState({ x: props.x ?? 5, y: props.y ?? 5 });
  
    const {width, height} = Dimensions.get('window')

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (event, gesture) => {
          // Save the final drop position
          let x = lastPosition.x + gesture.dx;
          let y = lastPosition.y + gesture.dy;
          x = x < 0 ? 5 : x > width ? width : x;
          y = y < 0 ? 5 : y > height ? height : y;
          setLastPosition({ x, y });
  
          // Reset animation values for the next drag
          pan.setValue({ x: 0, y: 0 });
        },
      })
    ).current;
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        props.style,
        {
          position: 'absolute',
          left: lastPosition.x,
          top: lastPosition.y,
        },
        { transform: pan.getTranslateTransform() },
      ]}
    >
        {props.children}
    </Animated.View>
  );
};

export default DraggableView;
