import { Badge, Button, Flex, Stack, type StackProps, Text } from '@chakra-ui/react';
import { PiCaretLeft } from 'react-icons/pi';

import type { ClientType } from '@/entities';

interface IClientHeaderProps {
  data: ClientType;
  onBackClick: () => void;
  containerProps?: StackProps;
}

export const ClientHeader = ({ data, onBackClick, containerProps }: IClientHeaderProps) => {
  return (
    <Stack
      flexShrink={0}
      backgroundColor="white"
      overflow="hidden"
      rounded="xl"
      {...containerProps}
    >
      <Flex px={5} py={4} direction="row" align="center" justify="space-between" gapX={5}>
        <Button size="md" variant="outline" rounded="lg" onClick={onBackClick}>
          <PiCaretLeft />
          Назад
        </Button>
        <Text
          fontSize="clamp(1.25rem, 2.5vw, 1.5rem)"
          textAlign="center"
          fontWeight="medium"
          maxW="475px"
        >
          {data.name}
        </Text>
        <Badge colorPalette="blue" size="lg">
          #{data.id_client}
        </Badge>
      </Flex>
    </Stack>
  );
};
