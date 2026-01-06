import React from 'react';
import { View, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  safeArea?: boolean;
  padding?: boolean;
  backgroundColor?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style,
  scrollable = false,
  safeArea = true,
  padding = true,
  backgroundColor = colors.background.primary,
}) => {
  const containerStyle = [
    styles.container,
    { backgroundColor },
    padding && styles.padding,
    style,
  ];

  const Wrapper = safeArea ? SafeAreaView : View;
  const Content = scrollable ? ScrollView : View;

  return (
    <Wrapper style={[styles.safeArea, { backgroundColor }]}>
      <Content
        style={scrollable ? undefined : containerStyle}
        contentContainerStyle={scrollable ? containerStyle : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Content>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});

export default Container;

