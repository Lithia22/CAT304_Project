import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Camera } from 'lucide-react-native';
import { buildApiUrl } from '../../configuration/config';
import { TopContProvider, BottomNavProvider } from '../Nav/ProviderNavigation';
import Error from '../../../Error'; 
import Success from '../../../Success';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

const AddStrokeMedicationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [dosageStrength, setDosageStrength] = useState('');
  const [price, setPrice] = useState('');
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [batch, setBatch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [image, setImage] = useState(null);

  const handleImagePick = async () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              setErrorMessage('Sorry, we need camera permissions to make this work!');
              setErrorVisible(true);
              return;
            }

            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
              });

              handleImageResponse(result);
            } catch (error) {
              console.error('Camera Error:', error);
              setErrorMessage('Failed to open camera');
              setErrorVisible(true);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              setErrorMessage('Sorry, we need gallery permissions to make this work!');
              setErrorVisible(true);
              return;
            }

            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
              });

              handleImageResponse(result);
            } catch (error) {
              console.error('Gallery Error:', error);
              setErrorMessage('Failed to open gallery');
              setErrorVisible(true);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const handleImageResponse = (result) => {
    if (result.canceled) {
      console.log('User cancelled image picker');
      return;
    }

    if (!result.canceled && result.assets[0]) {
      setImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
      });
    } else {
      setErrorMessage('Failed to get image data');
      setErrorVisible(true);
    }
  };

  const determineMedicationStatus = (current, reorder) => {
    const currentNum = parseInt(current);
    const reorderNum = parseInt(reorder);

    if (currentNum <= reorderNum) return 'Reorder Required';
    if (currentNum <= reorderNum + 10) return 'Low Stock';
    return 'Sufficient Stock';
  };

  const handleAddMedication = async () => {
    if (!medicationName || !quantity || !reorderPoint || 
        !dosageForm || !dosageStrength || !price || !batch) {
        setErrorMessage('All fields are required');
        setErrorVisible(true);
        return;
    }

    if (isNaN(parseInt(quantity)) || isNaN(parseInt(reorderPoint)) || 
        isNaN(parseFloat(price))) {
        setErrorMessage('Quantity, Reorder Point, and Price must be numeric');
        setErrorVisible(true);
        return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', medicationName);
    formData.append('quantity', quantity);
    formData.append('reorderPoint', reorderPoint);
    formData.append('dosageForm', dosageForm);
    formData.append('dosageStrength', dosageStrength);
    formData.append('price', price);
    formData.append('batch', batch);
    formData.append('expirationDate', expirationDate.toISOString().split('T')[0]);
    formData.append('status', determineMedicationStatus(quantity, reorderPoint));

    if (image) {
        const imageFileName = image.uri.split('/').pop();
        const imageType = 'image/' + (imageFileName.split('.').pop() === 'png' ? 'png' : 'jpeg');

        formData.append('image', {
            uri: image.uri,
            name: imageFileName,
            type: imageType,
        });
    }

    try {
      const response = await fetch(buildApiUrl('/api/stroke-medications'), {
          method: 'POST',
          headers: {
              'Content-Type': 'multipart/form-data',
          },
          body: formData,
      });

      const responseData = await response.json();

      if (responseData.success) {
        setSuccessMessage('Medication added successfully');
        setSuccessVisible(true);
        setTimeout(() => {
          setSuccessVisible(false);
          navigation.navigate('StrokeMedications', { 
            newMedication: responseData 
          });
        }, 1500);
      } else {
        setErrorMessage(responseData.message || 'Failed to add medication');
        setErrorVisible(true);
      }
    } catch (error) {
      setErrorMessage('Failed to add medication. Please try again later.');
      setErrorVisible(true);
      console.error('Error adding medication:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpirationDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopContProvider />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
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
            <Text style={styles.headerTitle}>Add Medication</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Medication Details</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Medication Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter medication name"
                value={medicationName}
                onChangeText={setMedicationName}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Batch Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter batch number"
                value={batch}
                onChangeText={setBatch}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Current Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Reorder Point</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter reorder point"
                value={reorderPoint}
                onChangeText={setReorderPoint}
                keyboardType="numeric"
              />
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Dosage Information</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Dosage Form</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter dosage form"
                value={dosageForm}
                onChangeText={setDosageForm}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Dosage Strength</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter dosage strength"
                value={dosageStrength}
                onChangeText={setDosageStrength}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Price per Unit</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Expiration Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#4A90E2" />
                <Text style={styles.datePickerText}>
                  {expirationDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={expirationDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                </View>
              )}
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Medication Image</Text>
            <TouchableOpacity 
              style={styles.imagePickerButton}
              onPress={handleImagePick}
            >
              <Camera size={24} color="#4A90E2" />
              <Text style={styles.imagePickerText}>
                {image ? 'Change Image' : 'Add Image'}
              </Text>
            </TouchableOpacity>

            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              </View>
            )}
          </LinearGradient>

          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleAddMedication}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Add Medication</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        
        <Success 
          visible={successVisible}
          onClose={() => setSuccessVisible(false)}
          message={successMessage}
        />

        <Error
          visible={errorVisible}
          onClose={() => setErrorVisible(false)}
          message={errorMessage}
        />
        
        <BottomNavProvider />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  container: {
    flex: 1,
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    padding: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A365D',
    marginBottom: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },
  input: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
    fontFamily: 'Poppins_400Regular',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
  },
  datePickerText: {
    fontSize: 16,
    color: '#2D3748',
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
  },
  datePickerContainer: {
    marginTop: 8,
    backgroundColor: '#F8FAFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4A90E2',
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },
  imagePreviewContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default AddStrokeMedicationScreen;