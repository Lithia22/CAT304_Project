import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import * as Font from 'expo-font'; // Import Font module

const Splash1 = ({ navigation }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Poppins_700Bold: require('../../../assets/Poppins/Poppins-Bold.ttf'),
      });
      setFontsLoaded(true);
    }

    loadFonts();

    const timer = setTimeout(() => {
      if (fontsLoaded) {
        navigation.navigate('Splash2');
      }
    }, 3001); // Navigate after 3 seconds once fonts are loaded

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [fontsLoaded, navigation]); // Added fontsLoaded to dependency

  if (!fontsLoaded) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container1}>
      {/* Ellipses */}
      <Svg width={300} height={300} viewBox="0 0 300 300" fill="none">
        <Ellipse cx={150} cy={150} rx={150} ry={150} fill="#549DF1" />
        <Ellipse cx={150} cy={150} rx={130} ry={130} fill="#61A7F9" />
        <Ellipse cx={150} cy={150} rx={110} ry={110} fill="#7DB9FF" />
        <Ellipse cx={150} cy={150} rx={90} ry={90} fill="#96C6FF" />
        <Ellipse cx={150} cy={150} rx={70} ry={70} fill="#FFF" />

        {/* Pill Icon */}
        <Path
          d="M22.1871 64.0601C16.2717 64.0601 11.2532 62.1461 7.13131 58.3179C3.00947 54.4898 0.948547 49.8288 0.948547 44.335C0.948547 41.705 1.48344 39.1919 2.55323 36.7957C3.62303 34.3994 5.16478 32.2662 7.17851 30.396L32.6647 6.72585C34.6784 4.85562 36.9754 3.42372 39.5554 2.43016C42.1355 1.4366 44.8415 0.939819 47.6733 0.939819C53.5886 0.939819 58.6072 2.85388 62.729 6.68201C66.8509 10.5101 68.9118 15.1711 68.9118 20.6649C68.9118 23.2949 68.3769 25.808 67.3071 28.2043C66.2373 30.6005 64.6955 32.7337 62.6818 34.604L37.1956 58.2741C35.1819 60.1443 32.885 61.5762 30.3049 62.5698C27.7248 63.5633 25.0189 64.0601 22.1871 64.0601ZM47.2957 38.9873L57.3958 29.6946C58.6544 28.5257 59.6298 27.1523 60.322 25.5743C61.0142 23.9963 61.3603 22.3598 61.3603 20.6649C61.3603 17.1582 60.0231 14.1629 57.3486 11.679C54.6741 9.19514 51.449 7.95319 47.6733 7.95319C45.8483 7.95319 44.0863 8.27463 42.3872 8.91752C40.6882 9.56042 39.2093 10.4663 37.9508 11.6352L27.9451 21.0156L47.2957 38.9873ZM22.1871 57.0468C24.012 57.0468 25.774 56.7253 27.4731 56.0824C29.1722 55.4395 30.651 54.5336 31.9096 53.3647L41.9153 43.9844L22.5646 26.0126L12.4645 35.3053C11.206 36.4742 10.2306 37.8477 9.53835 39.4257C8.84613 41.0037 8.50002 42.6401 8.50002 44.335C8.50002 47.8417 9.83726 50.837 12.5117 53.3209C15.1862 55.8048 18.4113 57.0468 22.1871 57.0468Z"
          fill="#4A90E2"
          transform="translate(110, 115) scale(1.1)"
        />
      </Svg>

      {/* App Name */}
      <Text style={styles.appName}>RePill</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container1: {
    flex: 1,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    paddingTop: 150,
    flexDirection: 'column',
  },
  appName: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: 50,
    marginTop: 60,
  },
});

export default Splash1;
