import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import React from 'react'
import { Text } from 'react-native'

import ApprovalScreen from '../screens/ApprovalScreen'
import HomeScreen from '../screens/HomeScreen'
import ScanScreen from '../screens/ScanScreen'
import WalletScreen from '../screens/WalletScreen'

const Tab = createBottomTabNavigator()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Scan: '📷',
    Approval: '🔐',
    Wallet: '💳',
  }

  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '•'}
    </Text>
  )
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: '#f4f1ea' },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', color: '#0f172a' },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#e2e8f0',
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Scan" component={ScanScreen} />
        <Tab.Screen name="Approval" component={ApprovalScreen} />
        <Tab.Screen name="Wallet" component={WalletScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
