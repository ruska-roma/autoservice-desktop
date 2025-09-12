import { Flex, Spinner } from '@chakra-ui/react';

export const Preloader = () => {
  return (
    <Flex w="100%" minH="100vh" h="100%" justify="center" align="center">
      <Spinner size="xl" colorPalette="blue" color="colorPalette.600" />
    </Flex>
  );
};
