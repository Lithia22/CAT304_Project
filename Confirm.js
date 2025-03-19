import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';

const Confirm = ({ visible, onClose, onConfirm, title, message }) => {
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
          <Svg width="68" height="66" viewBox="0 0 68 66" fill="none">
            <Ellipse cx="34.5917" cy="34.7835" rx="30.2326" ry="29.4" fill="#FED25F"/>
            <Path d="M33.9199 65.3167C29.3362 65.3167 25.0353 64.4712 21.0126 62.7832C16.9802 61.0911 13.4785 58.7975 10.5023 55.9033C7.52621 53.0092 5.169 49.6052 3.4305 45.6873C1.69639 41.7792 0.828125 37.6019 0.828125 33.1501C0.828125 28.6982 1.69639 24.5209 3.4305 20.6129C5.169 16.6949 7.52621 13.291 10.5023 10.3969C13.4785 7.50265 16.9802 5.20901 21.0126 3.51695C25.0353 1.8289 29.3362 0.983398 33.9199 0.983398C38.5036 0.983398 42.8044 1.8289 46.8272 3.51695C50.8595 5.20901 54.3613 7.50265 57.3374 10.3969C60.3135 13.291 62.6707 16.6949 64.4092 20.6129C66.1433 24.5209 67.0116 28.6982 67.0116 33.1501C67.0116 37.6019 66.1433 41.7792 64.4092 45.6873C62.6707 49.6052 60.3135 53.0092 57.3374 55.9033C54.3613 58.7975 50.8595 61.0911 46.8272 62.7832C42.8044 64.4712 38.5036 65.3167 33.9199 65.3167ZM33.9199 59.7834C41.5474 59.7834 48.0283 57.2042 53.3318 52.0469C58.6358 46.8889 61.2933 40.58 61.2933 33.1501C61.2933 25.7202 58.6358 19.4112 53.3318 14.2533C48.0283 9.0959 41.5474 6.51673 33.9199 6.51673C26.2923 6.51673 19.8114 9.0959 14.508 14.2533C9.20395 19.4112 6.54647 25.7202 6.54647 33.1501C6.54647 40.58 9.20395 46.8889 14.508 52.0469C19.8114 57.2042 26.2923 59.7834 33.9199 59.7834ZM35.9647 48.1858C35.4202 48.7153 34.75 48.9834 33.9199 48.9834C33.0897 48.9834 32.4195 48.7153 31.875 48.1858C31.3313 47.657 31.0607 47.0119 31.0607 46.2167C31.0607 45.4216 31.3313 44.7765 31.875 44.2477C32.4195 43.7182 33.0897 43.4501 33.9199 43.4501C34.75 43.4501 35.4202 43.7182 35.9647 44.2477C36.5084 44.7765 36.779 45.4216 36.779 46.2167C36.779 47.0119 36.5084 47.657 35.9647 48.1858ZM36.779 35.9167H31.0607V17.3167H36.779V35.9167Z" 
            fill="#383D46" 
            stroke="black"/>
          </Svg>
          </View>
          
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: '#2D3748',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#4A5568',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#EDF2F7',
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
});

export default Confirm;