import { ObserverProps } from './types';
import { ScrollView, View } from 'react-native';

class Observer {
  private root: ScrollView;
  private target: View;
  private?: string;

  constructor(props: ObserverProps) {
    const { root, target, observerKey } = props;
    this.root = root;
    this.target = target;
    this.observerKey = observerKey;
  }
}

export default Observer;
