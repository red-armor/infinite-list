import { View, Text } from 'react-native'
import React from 'react'

window.React2 = React

console.log('window react 2 ', window.React2)


console.log('vi ', window.React1, window.React2, window.React1 === window.React2)
export default () => {
  console.log('in list')

  return (
    <View></View>
  )

  // return (
  //   <View>
  //     <Text>hello</Text>
  //   </View>
  // )
};
