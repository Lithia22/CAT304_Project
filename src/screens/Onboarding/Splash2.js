import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import Svg, { Path, Rect, Ellipse } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const scale = Math.min(windowWidth / 375, windowHeight / 812); // Base scale on iPhone X dimensions

const Splash2 = () => {
  const navigation = useNavigation();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Poppins_300Light: require('../../../assets/Poppins/Poppins-Light.ttf'),
        Poppins_500Medium: require('../../../assets/Poppins/Poppins-Medium.ttf'),
        Poppins_700Bold: require('../../../assets/Poppins/Poppins-Bold.ttf'),
        Poppins_800ExtraBold: require('../../../assets/Poppins/Poppins-ExtraBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  const IconContainer = ({ icon, title, subtitle }) => (
    <View style={styles.iconContainer}>
      <Svg xmlns="http://www.w3.org/2000/svg" width={scale * 100} height={scale * 90} viewBox="0 0 100 76" fill="none">
        <Rect y="15" width="3" height="71" fill="#4A90E2" />
        <Ellipse cx="62.5" cy="45" rx="37.5" ry="38" fill="#4A90E2" />
        {icon}
      </Svg>
      <View style={styles.textWrapper}>
        <Text style={styles.iconTitle}>{title}</Text>
        <Text style={styles.iconSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Say goodbye to long queues</Text>
            <Text style={styles.subtitle}>experience hassle - free convenience!</Text>
          </View>

          <LinearGradient
            colors={['#F8FCFF', '#96C6FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBox}
          >
            <IconContainer
              icon={<Path d="M16 21.3334C17.6667 21.3334 19.0833 20.75 20.25 19.5834C21.4167 18.4167 22 17 22 15.3334C22 13.6667 21.4167 12.25 20.25 11.0834C19.0833 9.91671 17.6667 9.33337 16 9.33337C14.3333 9.33337 12.9167 9.91671 11.75 11.0834C10.5833 12.25 10 13.6667 10 15.3334C10 17 10.5833 18.4167 11.75 19.5834C12.9167 20.75 14.3333 21.3334 16 21.3334ZM16 18.9334C15 18.9334 14.15 18.5834 13.45 17.8834C12.75 17.1834 12.4 16.3334 12.4 15.3334C12.4 14.3334 12.75 13.4834 13.45 12.7834C14.15 12.0834 15 11.7334 16 11.7334C17 11.7334 17.85 12.0834 18.55 12.7834C19.25 13.4834 19.6 14.3334 19.6 15.3334C19.6 16.3334 19.25 17.1834 18.55 17.8834C17.85 18.5834 17 18.9334 16 18.9334ZM16 25.3334C12.7556 25.3334 9.8 24.4278 7.13333 22.6167C4.46666 20.8056 2.53333 18.3778 1.33333 15.3334C2.53333 12.2889 4.46666 9.86115 7.13333 8.05004C9.8 6.23893 12.7556 5.33337 16 5.33337C19.2444 5.33337 22.2 6.23893 24.8667 8.05004C27.5333 9.86115 29.4667 12.2889 30.6667 15.3334C29.4667 18.3778 27.5333 20.8056 24.8667 22.6167C22.2 24.4278 19.2444 25.3334 16 25.3334ZM16 22.6667C18.5111 22.6667 20.8167 22.0056 22.9167 20.6834C25.0167 19.3612 26.6222 17.5778 27.7333 15.3334C26.6222 13.0889 25.0167 11.3056 22.9167 9.98337C20.8167 8.66115 18.5111 8.00004 16 8.00004C13.4889 8.00004 11.1833 8.66115 9.08333 9.98337C6.98333 11.3056 5.37777 13.0889 4.26666 15.3334C5.37777 17.5778 6.98333 19.3612 9.08333 20.6834C11.1833 22.0056 13.4889 22.6667 16 22.6667Z"
                          fill="white" 
                          transform="translate(45, 28) scale(1.1)" 
                    />}
              title="View"
              subtitle="medical records and prescriptions"
            />
            <IconContainer
              icon={<Path d="M5.33333 25.3333V22.6666H7.99999V13.3333C7.99999 11.4888 8.55555 9.84996 9.66666 8.41663C10.7778 6.98329 12.2222 6.0444 14 5.59996V4.66663C14 4.11107 14.1944 3.63885 14.5833 3.24996C14.9722 2.86107 15.4444 2.66663 16 2.66663C16.5556 2.66663 17.0278 2.86107 17.4167 3.24996C17.8056 3.63885 18 4.11107 18 4.66663V5.59996C19.7778 6.0444 21.2222 6.98329 22.3333 8.41663C23.4444 9.84996 24 11.4888 24 13.3333V22.6666H26.6667V25.3333H5.33333ZM16 29.3333C15.2667 29.3333 14.6389 29.0722 14.1167 28.55C13.5944 28.0277 13.3333 27.4 13.3333 26.6666H18.6667C18.6667 27.4 18.4056 28.0277 17.8833 28.55C17.3611 29.0722 16.7333 29.3333 16 29.3333ZM10.6667 22.6666H21.3333V13.3333C21.3333 11.8666 20.8111 10.6111 19.7667 9.56663C18.7222 8.52218 17.4667 7.99996 16 7.99996C14.5333 7.99996 13.2778 8.52218 12.2333 9.56663C11.1889 10.6111 10.6667 11.8666 10.6667 13.3333V22.6666Z"              
                          fill="white"
                          transform="translate(45, 28) scale(1.1)" 
                    />}
              title="Receive"
              subtitle="pill refill notifications"
            />
            <IconContainer
              icon={<Path d="M13.9667 29.3334C13.3444 29.3334 12.7611 29.2 12.2167 28.9334C11.6722 28.6667 11.2111 28.2889 10.8333 27.8L3.56667 18.5667L4.2 17.9C4.64444 17.4334 5.17778 17.1556 5.8 17.0667C6.42222 16.9778 7 17.1 7.53333 17.4334L10 18.9334V8.00004C10 7.62226 10.1278 7.3056 10.3833 7.05004C10.6389 6.79449 10.9556 6.66671 11.3333 6.66671C11.7111 6.66671 12.0333 6.79449 12.3 7.05004C12.5667 7.3056 12.7 7.62226 12.7 8.00004V23.7334L9.46667 21.7334L12.9333 26.1667C13.0667 26.3223 13.2222 26.4445 13.4 26.5334C13.5778 26.6223 13.7667 26.6667 13.9667 26.6667H21.3333C22.0667 26.6667 22.6944 26.4056 23.2167 25.8834C23.7389 25.3612 24 24.7334 24 24V18.6667C24 18.2889 23.8722 17.9723 23.6167 17.7167C23.3611 17.4612 23.0444 17.3334 22.6667 17.3334H15.3667V14.6667H22.6667C23.7778 14.6667 24.7222 15.0556 25.5 15.8334C26.2778 16.6112 26.6667 17.5556 26.6667 18.6667V24C26.6667 25.4667 26.1444 26.7223 25.1 27.7667C24.0556 28.8112 22.8 29.3334 21.3333 29.3334H13.9667ZM5.56667 11.3334C5.27778 10.8445 5.05555 10.3167 4.9 9.75004C4.74444 9.18337 4.66667 8.60004 4.66667 8.00004C4.66667 6.1556 5.31667 4.58337 6.61667 3.28337C7.91667 1.98337 9.48889 1.33337 11.3333 1.33337C13.1778 1.33337 14.75 1.98337 16.05 3.28337C17.35 4.58337 18 6.1556 18 8.00004C18 8.60004 17.9222 9.18337 17.7667 9.75004C17.6111 10.3167 17.3889 10.8445 17.1 11.3334L14.8 10C14.9778 9.68893 15.1111 9.37226 15.2 9.05004C15.2889 8.72782 15.3333 8.37782 15.3333 8.00004C15.3333 6.88893 14.9444 5.94449 14.1667 5.16671C13.3889 4.38893 12.4444 4.00004 11.3333 4.00004C10.2222 4.00004 9.27778 4.38893 8.5 5.16671C7.72222 5.94449 7.33333 6.88893 7.33333 8.00004C7.33333 8.37782 7.37778 8.72782 7.46667 9.05004C7.55555 9.37226 7.68889 9.68893 7.86667 10L5.56667 11.3334Z"              
                          fill="white"
                          transform="translate(45, 28) scale(1.1)" 
                    />}
              title="Order"
              subtitle="refills in just a few steps"
            />
            <IconContainer
              icon={<Path d="M14.2222 27.88V16.92L3.55556 11.36V22.32L14.2222 27.88ZM17.7778 27.88L28.4444 22.32V11.36L17.7778 16.92V27.88ZM14.2222 31.56L1.77778 25.12C1.21481 24.8267 0.777778 24.44 0.466667 23.96C0.155556 23.48 0 22.9467 0 22.36V9.64C0 9.05333 0.155556 8.52 0.466667 8.04C0.777778 7.56 1.21481 7.17333 1.77778 6.88L14.2222 0.44C14.7852 0.146667 15.3778 0 16 0C16.6222 0 17.2148 0.146667 17.7778 0.44L30.2222 6.88C30.7852 7.17333 31.2222 7.56 31.5333 8.04C31.8444 8.52 32 9.05333 32 9.64V22.36C32 22.9467 31.8444 23.48 31.5333 23.96C31.2222 24.44 30.7852 24.8267 30.2222 25.12L17.7778 31.56C17.2148 31.8533 16.6222 32 16 32C15.3778 32 14.7852 31.8533 14.2222 31.56ZM23.1111 10.44L26.5333 8.68L16 3.2L12.5333 5L23.1111 10.44ZM16 14.16L19.4667 12.36L8.93333 6.88L5.46667 8.68L16 14.16Z"              
                          fill="white"
                          transform="translate(45, 28) scale(1.1)" 
                    />}
              title="Delivery"
              subtitle="direct to your house"
            />
          </LinearGradient>

          <TouchableOpacity 
            style={styles.getStartedButton} 
            onPress={handleGetStarted}
          >        
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: windowHeight * 0.04,
    paddingHorizontal: windowWidth * 0.05,
  },
  headerSection: {
    width: '100%',
    marginBottom: windowHeight * 0.03,
  },
  title: {
    color: '#F4F4F4',
    fontFamily: 'Poppins_500Medium',
    fontSize: scale * 30,
    lineHeight: scale * 36,
    letterSpacing: -1.5,
    maxWidth: windowWidth * 0.7,
  },
  subtitle: {
    color: '#F4F4F4',
    fontFamily: 'Poppins_300Light',
    fontSize: scale * 28,
    lineHeight: scale * 36,
    letterSpacing: -1.4,
    maxWidth: windowWidth * 0.9,
    marginTop: scale * 10,
  },
  gradientBox: {
    width: windowWidth * 0.9,
    minHeight: windowHeight * 0.45,
    borderRadius: scale * 22,
    padding: scale * 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginVertical: windowHeight * 0.03,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale * 15,
    paddingRight: scale * 10,
  },
  textWrapper: {
    flex: 1,
    paddingLeft: scale * 15,
  },
  iconTitle: {
    fontSize: scale * 25,
    color: '#383D46',
    fontFamily: 'Poppins_800ExtraBold',
    lineHeight: scale * 33,
  },
  iconSubtitle: {
    fontSize: scale * 12,
    color: '#383D46',
    fontFamily: 'Poppins_500Medium',
    lineHeight: scale * 15,
  },
  getStartedButton: {
    width: windowWidth * 0.85,
    height: windowHeight * 0.06,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#383D46',
    borderRadius: scale * 13,
    marginTop: windowHeight * 0.02,
  },
  buttonText: {
    letterSpacing: -1,
    color: '#000',
    fontSize: scale * 18,
    fontFamily: 'Poppins_500Medium',
    lineHeight: scale * 26,
  },
});

export default Splash2;