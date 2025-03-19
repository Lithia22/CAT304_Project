import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

const Order = () => {
  const orders = [
    { id: 1, name: 'Order #1', status: 'Pending' },
    { id: 2, name: 'Order #2', status: 'Completed' },
    { id: 3, name: 'Order #3', status: 'Shipped' },
  ];

  const renderOrderCard = (order) => (
    <TouchableOpacity key={order.id} style={styles.orderCard}>
      <View style={styles.cardContent}>
        <Text style={styles.orderName}>{order.name}</Text>
        <Text style={[styles.orderStatus, getStatusStyle(order.status)]}>{order.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return { color: '#E53E3E' };
      case 'Completed':
        return { color: '#38A169' };
      case 'Shipped':
        return { color: '#3182CE' };
      default:
        return { color: '#4A5568' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {orders.map(renderOrderCard)}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#4299E1',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  orderStatus: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Order;
