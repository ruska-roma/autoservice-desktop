import { Container as UIContainer, type ContainerProps } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';

interface IContainerProps extends ContainerProps {}

export function Container({ children, ...props }: PropsWithChildren<IContainerProps>) {
  return (
    <UIContainer
      flexDirection="column"
      overflowY="auto"
      display="flex"
      h="full"
      fluid
      p={5}
      {...props}
    >
      {children}
    </UIContainer>
  );
}
