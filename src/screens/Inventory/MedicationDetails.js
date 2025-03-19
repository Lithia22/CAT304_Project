import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';

const { width } = Dimensions.get('window');

const MedicationDetails = ({ navigation }) => {
  const medicationCategories = [
    { name: 'Diabetes', screenName: 'DiabetesMedications', color: '#4A90E2', icon: 'medical-bag' },
    { name: 'Cardiovascular Disease', screenName: 'CardiovascularMedications', color: '#3B7BA2', icon: 'heart-pulse' },
    { name: 'Cancer', screenName: 'CancerMedications', color: '#5DADE2', icon: 'microscope' },
    { name: 'Kidney Disease', screenName: 'KidneyDiseaseMedications', color: '#4A90E2', icon: 'water' },
    { name: 'Stroke', screenName: 'StrokeMedications', color: '#3B7BA2', icon: 'brain' },
    { name: 'Arthritis', screenName: 'ArthritisMedications', color: '#5DADE2', icon: 'bone' },
  ];

  const handleCategoryPress = (screenName) => {
    console.log(`Navigating to: ${screenName}`);
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopContProvider />
      
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.headerGradient}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButtonContainer}
          >
            <Text style={styles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medication Categories</Text>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.subtitle}>Select a medical category for detailed information</Text>
        
        <View style={styles.circleContainer}>
          <View style={styles.row}>
            {medicationCategories.slice(0, 2).map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.circle, { backgroundColor: category.color }]}
                onPress={() => handleCategoryPress(category.screenName)}
                activeOpacity={0.7}
              >
                <Text style={styles.circleText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            {medicationCategories.slice(2, 4).map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.circle, { backgroundColor: category.color }]}
                onPress={() => handleCategoryPress(category.screenName)}
                activeOpacity={0.7}
              >
                <Text style={styles.circleText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            {medicationCategories.slice(4).map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.circle, { backgroundColor: category.color }]}
                onPress={() => handleCategoryPress(category.screenName)}
                activeOpacity={0.7}
              >
                <Text style={styles.circleText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
      <BottomNavProvider />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonContainer: {
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 50,
    color: '#4A90E2',
    fontFamily: 'Poppins_700Bold',
    top: -10,
  },
  headerTitle: {
    fontSize: 24,
    color: '#2D3748',
    fontFamily: 'Poppins_700Bold',
  },
  placeholderView: {
    width: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  circleContainer: {
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    width: '100%',
  },
  circle: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    elevation: 6,
    shadowColor: '#1A5276',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(41, 128, 185, 0.1)',
  },
  circleText: {
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default MedicationDetails;