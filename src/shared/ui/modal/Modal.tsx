import { CloseButton, Dialog, Flex, Portal, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface IModalProps {
  title: string;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
  bodyLayout: ReactNode;
  footerLayout: ReactNode;
}

export const Modal = ({ title, isOpen, onOpen, bodyLayout, footerLayout }: IModalProps) => {
  return (
    <Dialog.Root
      size="md"
      placement="center"
      motionPreset="slide-in-bottom"
      open={isOpen}
      onOpenChange={(state) => onOpen(state.open)}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header borderBottomWidth="1px" pb={5} mb={3}>
              <Flex direction="row" justify="space-between" align="center" w="full">
                <Text textStyle="xl" fontWeight="medium">
                  {title}
                </Text>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>
            <Dialog.Body>{bodyLayout}</Dialog.Body>
            <Dialog.Footer>{footerLayout}</Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
