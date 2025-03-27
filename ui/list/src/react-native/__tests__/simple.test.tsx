import { render, screen } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';

// import { describe, expect, test } from '@jest/globals';

const MyApp = () => {
  return (
    <View>
      <Text>Hello world</Text>
      <Button
        title="start"
        onPress={() => {
          // do nothing
        }}
      />
    </View>
  );
};

// console.log('test --- ', test, expect)

test('basic test', () => {
  render(<MyApp />);

  console.log('scee 000', screen.getAllByRole('button', { name: 'start' }));

  // console.log('expoect ---', expect(screen.getAllByRole('button', { name: 'start' })).toBeOnTheScreen)
  console.log(
    'expoect ---',
    expect(screen.getAllByRole('text')).toBeOnTheScreen
  );
  expect(3).toBe(3);

  expect(screen.getByRole('button', { name: 'start' })).toBeOnTheScreen();
  // expect(screen.getAllByRole('text')).toBeOnTheScreen();
});
