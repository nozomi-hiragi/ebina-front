import React from "react";
import { useSetRecoilState } from 'recoil'
import { useNavigate } from "react-router-dom";
import { Burger, Button, Group, Header, MantineSize, MediaQuery, Text, useMantineTheme } from "@mantine/core";
import { userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";

type HeaderProps = {
  hideSize?: MantineSize,
  isOpen?: boolean,
  onBurgerClick?: (e: any) => void
}

const EbinaHeader: React.FC<HeaderProps> = (props) => {
  const theme = useMantineTheme();
  const navigate = useNavigate()
  const setUser = useSetRecoilState(userSelector)
  return (<>
    <Header height={70} p="md">
      <Group position="apart">
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {props.hideSize &&
            <MediaQuery largerThan={props.hideSize} styles={{ display: 'none' }}>
              <Burger
                opened={props.isOpen ?? false}
                onClick={props.onBurgerClick}
                size="sm"
                color={theme.colors.gray[6]}
                mr="md"
              />
            </MediaQuery>
          }
          <Text>EbinaStation</Text>
        </div>
        <Button color="inherit" onClick={() => {
          EbinaAPI.logout()
          setUser(null)
          navigate('/')
        }}>Logout</Button>
      </Group>
    </Header>
  </>)
}

export default EbinaHeader
