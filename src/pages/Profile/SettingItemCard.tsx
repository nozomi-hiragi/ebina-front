import { Center, Paper, Text } from "@mantine/core";
import { ReactNode } from "react";

const SettingItemCard = (
  { children, title }: { children: ReactNode; title: string },
) => (
  <Center>
    <Paper p="lg" shadow="md" withBorder sx={{ width: 380, maxWidth: 380 }}>
      <Text size="lg" weight={500} mb="xs">{title}</Text>
      {children}
    </Paper>
  </Center>
);

export default SettingItemCard;
