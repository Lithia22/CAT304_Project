import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

const Success = ({ visible, onClose, message }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
      <Svg width="68" height="66" viewBox="0 0 76 72" fill="none">
        <Ellipse cx="38" cy="36" rx="34" ry="34" fill="#FED25F" />
        <Path
            d="M32.75 51.7916L17.5362 37.254L22.0625 32.9289L32.4046 42.8113L32.75 43.1414L33.0954 42.8113L53.9375 22.8956L58.4638 27.2207L32.75 51.7916ZM38 71.3332C32.8745 71.3332 28.0646 70.4041 23.5656 68.549C19.0572 66.6901 15.1417 64.1701 11.8142 60.9904C8.48675 57.8109 5.85182 54.0718 3.90882 49.7691C1.97034 45.4764 1 40.8885 1 35.9998C1 31.1112 1.97034 26.5233 3.90882 22.2306C5.85182 17.9279 8.48675 14.1888 11.8142 11.0092C15.1417 7.82957 19.0572 5.30957 23.5656 3.45063C28.0646 1.59557 32.8745 0.666504 38 0.666504C43.1255 0.666504 47.9354 1.59557 52.4344 3.45063C56.9428 5.30957 60.8583 7.82957 64.1858 11.0092C67.5133 14.1888 70.1482 17.9279 72.0912 22.2306C74.0297 26.5233 75 31.1112 75 35.9998C75 40.8885 74.0297 45.4764 72.0912 49.7691C70.1482 54.0718 67.5133 57.8109 64.1858 60.9904C60.8583 64.1701 56.9428 66.6901 52.4344 68.549C47.9354 70.4041 43.1255 71.3332 38 71.3332ZM38 65.1665C46.4977 65.1665 53.7169 62.3438 59.6267 56.6967C65.5374 51.0487 68.5 44.1399 68.5 35.9998C68.5 27.8598 65.5374 20.9509 59.6267 15.3029C53.7169 9.65584 46.4977 6.83317 38 6.83317C29.5023 6.83317 22.2831 9.65584 16.3733 15.3029C10.4626 20.9509 7.5 27.8598 7.5 35.9998C7.5 44.1399 10.4626 51.0487 16.3733 56.6967C22.2831 62.3438 29.5023 65.1665 38 65.1665Z" 
            fill="#383D46" 
            stroke="black"
        />
       </Svg>

        <View style={styles.modalTextContainer}>
          <Text style={styles.modalText}>{message}</Text>
        </View>
        <TouchableOpacity
          style={styles.modalButton}
          onPress={onClose}
        >
          <Text style={styles.modalButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Math.min(width * 0.9, 325),
    backgroundColor: '#FFF',
    borderRadius: scale * 27,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale * 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTextContainer: {
    width: '100%',
    marginVertical: scale * 15,
  },
  modalText: {
    color: '#383D46',
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
    fontSize: scale * 15,
    lineHeight: scale * 22.5,
  },
  modalButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: scale * 30,
    paddingVertical: scale * 10,
    borderRadius: scale * 15,
    marginTop: scale * 10,
  },
  modalButtonText: {
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: scale * 16,
  },
});

export default Success;