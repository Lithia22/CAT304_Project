import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NotificationProvider } from './ProviderNotification';
import { PatientNotificationProvider } from './PatientNotification';

import Splash1 from './src/screens/Onboarding/Splash1';
import Splash2 from './src/screens/Onboarding/Splash2';
import Login from './src/screens/Auth/Login';
import SignUp from './src/screens/Auth/SignUp';
import ForgotPassword from './src/screens/Auth/ForgotPassword';
import VerifyCode from './src/screens/Auth/VerifyCode';
import ResetPassword from './src/screens/Auth/ResetPassword';
import HomePatient from './src/screens/PatientMedRec/HomePatient';
import ViewMedRec from './src/screens/PatientMedRec/ViewMedRec';
import EditPatient from './src/screens/PatientProfile/EditPatient';
import InfoPatient from './src/screens/PatientProfile/InfoPatient';
import EditAddress from './src/screens/PatientMedRec/EditAddress';
import HomeProvider from './src/screens/ProviderMedRec/HomeProvider';
import Prescription from './src/screens/PatientPresc/Prescription';
import ViewPresc from './src/screens/PatientPresc/ViewPresc';
import ProviderPresc from './src/screens/ProviderPresc/ProviderPresc';
import EditPatientPresc from './src/screens/ProviderPresc/EditPatientPresc';
import ViewPatientPresc from './src/screens/ProviderPresc/ViewPatientPresc';
import AddPatientPresc from './src/screens/ProviderPresc/AddPatientPresc';
import ViewPatientMedRec from './src/screens/ProviderMedRec/ViewPatientMedRec';
import EditPatientMedRec from './src/screens/ProviderMedRec/EditPatientMedRec';
import AddPatientMedRec from './src/screens/ProviderMedRec/AddPatientMedRec';

import OrderList from './src/screens/PatientOrder/OrderList';
import DeliveryDetails from './src/screens/PatientOrder/DeliveryDetails';
import PickupDetails from './src/screens/PatientOrder/PickupDetails';

import EditProvider from './src/screens/ProviderProfile/EditProvider';
import InfoProvider from './src/screens/ProviderProfile/InfoProvider';

{/* Provider Inventory Imports */}
import FrontPage from './src/screens/Inventory/FrontPage';
import MedicationInfo from './src/screens/Inventory/MedicationInfo';
import RestockingDetails from './src/screens/Inventory/RestockingDetails';
import MedicationDetails from './src/screens/Inventory/MedicationDetails';
import DiabetesMedications from './src/screens/Inventory/DiabetesMedications';
import AddMedicationScreen from './src/screens/Inventory/AddMedicationScreen';
import EditMedicationScreen from './src/screens/Inventory/EditMedicationScreen';
import CardiovascularMedications from './src/screens/Inventory/CardiovascularMedications';
import CancerMedications from './src/screens/Inventory/CancerMedications';
import AddCancerMedicationScreen from './src/screens/Inventory/AddCancerMedicationScreen';
import EditCancerMedScreen from './src/screens/Inventory/EditCancerMedScreen';
import CancerMedicationInfo from './src/screens/Inventory/CancerMedicationInfo';
import CardiovascularMedicationInfo from './src/screens/Inventory/CardiovascularMedicationInfo';
import KidneyDiseaseMedications from './src/screens/Inventory/KidneyDiseaseMedications';
import StrokeMedications from './src/screens/Inventory/StrokeMedications';
import ArthritisMedications from './src/screens/Inventory/ArthritisMedications';
import AddCardiovascularMedicationScreen from './src/screens/Inventory/AddCardiovascularMedicationScreen';
import EditCardioMedScreen from './src/screens/Inventory/EditCardioMedScreen';
import AddKidneyMedicationScreen from './src/screens/Inventory/AddKidneyMedicationScreen';
import EditKidneyMedScreen from './src/screens/Inventory/EditKidneyMedScreen';
import KidneyMedicationInfo from './src/screens/Inventory/KidneyMedicationInfo';
import AddStrokeMedicationScreen from './src/screens/Inventory/AddStrokeMedicationScreen';
import EditStrokeMedScreen from './src/screens/Inventory/EditStrokeMedScreen';
import StrokeMedicationInfo from './src/screens/Inventory/StrokeMedicationInfo';
import AddArthritisMedicationScreen from './src/screens/Inventory/AddArthritisMedicationScreen';
import EditArthritisMedScreen from './src/screens/Inventory/EditArthritisMedScreen';
import ArthritisMedicationInfo from './src/screens/Inventory/ArthritisMedicationInfo';

{/* Provider Order Imports */}
import Order from './src/screens/ProviderOrder/Order';
import AddToCart from './src/screens/ProviderOrder/AddToCart';
import OrderSummary from './src/screens/ProviderOrder/OrderSummary';

const Stack = createStackNavigator();
const ProviderStack = createStackNavigator();
const PatientStack = createStackNavigator();

const ProviderNavigator = () => (
  <NotificationProvider>
    <ProviderStack.Navigator screenOptions={{ headerShown: false }}>
      <ProviderStack.Screen name="HomeProvider" component={HomeProvider} />
      <ProviderStack.Screen name="ViewPatientMedRec" component={ViewPatientMedRec} />
      <ProviderStack.Screen name="EditPatientMedRec" component={EditPatientMedRec} />
      <ProviderStack.Screen name="AddPatientMedRec" component={AddPatientMedRec} />
      <ProviderStack.Screen name="ProviderPresc" component={ProviderPresc} />
      <ProviderStack.Screen name="EditPatientPresc" component={EditPatientPresc} />
      <ProviderStack.Screen name="ViewPatientPresc" component={ViewPatientPresc} />
      <ProviderStack.Screen name="AddPatientPresc" component={AddPatientPresc} />
      <ProviderStack.Screen name="EditProvider" component={EditProvider} />
      <ProviderStack.Screen name="InfoProvider" component={InfoProvider} />
      
      {/* Provider Inventory Screens */}
      <ProviderStack.Screen name="FrontPage" component={FrontPage} />
      <ProviderStack.Screen name="MedicationInfo" component={MedicationInfo} />
      <ProviderStack.Screen name="RestockingDetails" component={RestockingDetails} />
      <ProviderStack.Screen name="MedicationDetails" component={MedicationDetails} />
      <ProviderStack.Screen name="DiabetesMedications" component={DiabetesMedications} />
      <ProviderStack.Screen name="AddMedicationScreen" component={AddMedicationScreen} />
      <ProviderStack.Screen name="EditMedicationScreen" component={EditMedicationScreen} />
      <ProviderStack.Screen name="CardiovascularMedications" component={CardiovascularMedications} />
      <ProviderStack.Screen name="CancerMedications" component={CancerMedications} />
      <ProviderStack.Screen name="AddCancerMedicationScreen" component={AddCancerMedicationScreen} />
      <ProviderStack.Screen name="EditCancerMedScreen" component={EditCancerMedScreen} />
      <ProviderStack.Screen name="CancerMedicationInfo" component={CancerMedicationInfo} />
      <ProviderStack.Screen name="CardiovascularMedicationInfo" component={CardiovascularMedicationInfo} />
      <ProviderStack.Screen name="KidneyDiseaseMedications" component={KidneyDiseaseMedications} />
      <ProviderStack.Screen name="StrokeMedications" component={StrokeMedications} />
      <ProviderStack.Screen name="ArthritisMedications" component={ArthritisMedications} />
      <ProviderStack.Screen name="AddCardiovascularMedicationScreen" component={AddCardiovascularMedicationScreen} />
      <ProviderStack.Screen name="EditCardioMedScreen" component={EditCardioMedScreen} />
      <ProviderStack.Screen name="AddKidneyMedicationScreen" component={AddKidneyMedicationScreen} />
      <ProviderStack.Screen name="EditKidneyMedScreen" component={EditKidneyMedScreen} />
      <ProviderStack.Screen name="KidneyMedicationInfo" component={KidneyMedicationInfo} />
      <ProviderStack.Screen name="AddStrokeMedicationScreen" component={AddStrokeMedicationScreen} />
      <ProviderStack.Screen name="EditStrokeMedScreen" component={EditStrokeMedScreen} />
      <ProviderStack.Screen name="StrokeMedicationInfo" component={StrokeMedicationInfo} />
      <ProviderStack.Screen name="AddArthritisMedicationScreen" component={AddArthritisMedicationScreen} />
      <ProviderStack.Screen name="EditArthritisMedScreen" component={EditArthritisMedScreen} />
      <ProviderStack.Screen name="ArthritisMedicationInfo" component={ArthritisMedicationInfo} />

      <ProviderStack.Screen name="Order" component={Order} />
      <ProviderStack.Screen name="AddToCart" component={AddToCart} />
      <ProviderStack.Screen name="OrderSummary" component={OrderSummary} />
    </ProviderStack.Navigator>
  </NotificationProvider>
);

const PatientNavigator = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    getUserId();
  }, []);

  return (
    <PatientNotificationProvider>
      <PatientStack.Navigator screenOptions={{ headerShown: false }}>
        <PatientStack.Screen 
          name="HomePatient" 
          component={HomePatient}
        />
      <PatientStack.Screen name="ViewMedRec" component={ViewMedRec} />
      <PatientStack.Screen name="Prescription" component={Prescription} />
      <PatientStack.Screen name="ViewPresc" component={ViewPresc} />
      <PatientStack.Screen name="OrderList" component={OrderList} />
      <PatientStack.Screen name="DeliveryDetails" component={DeliveryDetails} />
      <PatientStack.Screen name="PickupDetails" component={PickupDetails} />
      <PatientStack.Screen name="EditPatient" component={EditPatient} />
      <PatientStack.Screen name="InfoPatient" component={InfoPatient} />
      <PatientStack.Screen name="EditAddress" component={EditAddress} />
    </PatientStack.Navigator>
  </PatientNotificationProvider>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Onboarding & Auth Screens */}
        <Stack.Screen name="Splash1" component={Splash1} />
        <Stack.Screen name="Splash2" component={Splash2} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="VerifyCode" component={VerifyCode} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />

        {/* Patient Screens - Wrapped with PatientNotificationProvider */}
        <Stack.Screen name="PatientScreens" component={PatientNavigator} />

        {/* Provider Screens - Wrapped with NotificationProvider */}
        <Stack.Screen name="ProviderScreens" component={ProviderNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}