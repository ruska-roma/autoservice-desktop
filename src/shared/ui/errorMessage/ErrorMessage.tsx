import { EmptyState, VStack } from '@chakra-ui/react';
import { FcAutomotive } from 'react-icons/fc';

export function ErrorMessage() {
  return (
    <EmptyState.Root size="lg">
      <EmptyState.Content rowGap={0}>
        <EmptyState.Indicator marginBottom="15px" fontSize="6rem">
          <FcAutomotive />
        </EmptyState.Indicator>
        <VStack textAlign="center" rowGap="5px" marginBottom="30px">
          <EmptyState.Title>Не тот поворот...</EmptyState.Title>
          <EmptyState.Description>
            Здесь только масло и гайки, а такого раздела нет
          </EmptyState.Description>
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
