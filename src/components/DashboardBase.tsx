import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Breadcrumbs,
  Button,
  Group,
  Modal,
  Navbar,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import BaseMenu from "./BaseMenu";
import EbinaHeader from "./EbinaHeader";
import EbinaAPI from "../EbinaAPI";
import { useRecoilValue, useResetRecoilState } from "recoil";
import { userSelector } from "../recoil/user";
import { getLabelFromPaht } from "../App";
import { startAuthentication } from "@simplewebauthn/browser";
import { Mutex } from "async-mutex";
import { useForm } from "@mantine/form";

type PasswordDialogProps = {
  opend: boolean;
  onClose: () => void;
  onLoggedIn: () => void;
};
const PasswordDialog = (props: PasswordDialogProps) => {
  const user = useRecoilValue(userSelector);
  const loginForm = useForm({ initialValues: { pass: "" } });
  return (
    <Modal centered opened={props.opend} onClose={props.onClose} title="Login">
      <form
        onSubmit={loginForm.onSubmit(async (values) => {
          if (!user) {
            throw new Error("No user");
          }
          await EbinaAPI.loginWithPassword(user.id, values.pass).then(() => {
            props.onClose();
            props.onLoggedIn();
          }).catch(() => {
            loginForm.setErrors({ pass: "Login failed" });
          });
        })}
      >
        <PasswordInput
          mt="lg"
          required
          label="Password"
          autoComplete="current-password"
          {...loginForm.getInputProps("pass")}
        />
        <Group mt="lg" grow>
          <Button type="submit">Login</Button>
        </Group>
      </form>
    </Modal>
  );
};

const mutex = new Mutex();
const DashboardBase = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const user = useRecoilValue(userSelector);
  const resetUser = useResetRecoilState(userSelector);
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [isPassword, setIsPassword] = useState(false);

  useEffect(() => {
    mutex.runExclusive(async () => {
      try {
        if (EbinaAPI.hasToken()) {
          setLoaded(true);
          return;
        }
        if (!user) throw new Error("no user");

        await EbinaAPI.getLoginOptions(user.id).then(async (ret) => {
          if (ret.type === "WebAuthn") {
            await startAuthentication(ret.options).then((result) =>
              EbinaAPI.loginWithWAOption(result, ret.sessionId)
            ).then(() => setLoaded(true));
          } else {
            setIsPassword(true);
          }
        });
      } catch {
        resetUser();
        navigate("/");
      }
    });
    // eslint-disable-next-line
  }, []);

  const location = useLocation();
  const paths = location.pathname.split("/").filter((value) => value !== "");

  const temp = ["/"];
  const anchors = paths.map((path) => {
    temp.push(path);
    const label = getLabelFromPaht(path);
    const to = temp.join("/");
    return path === paths[paths.length - 1]
      ? <Text key={to}>{label}</Text>
      : <Anchor key={to} component={Link} to={to}>{label}</Anchor>;
  });

  return (
    <AppShell
      fixed
      header={
        <EbinaHeader
          hideSize="sm"
          isOpen={isDrawerOpen}
          onBurgerClick={() => setDrawerOpen((o) => !o)}
        />
      }
      navbar={
        <Navbar
          width={{ base: 200 }}
          p={0}
          hidden={!isDrawerOpen}
          hiddenBreakpoint="sm"
        >
          <Group sx={{ height: "100%" }} spacing="xs" pl="lg">
            <BaseMenu
              onClick={() => {
                setDrawerOpen(false);
              }}
            />
          </Group>
        </Navbar>
      }
      navbarOffsetBreakpoint="sm"
      padding={0}
    >
      <Stack px="sm" sx={{ height: "100%" }}>
        <Breadcrumbs mt="sm">
          {anchors}
        </Breadcrumbs>
        <Suspense>
          {loaded ? <Outlet /> : (
            isPassword && (
              <PasswordDialog
                opend={isPassword}
                onClose={() => setIsPassword(false)}
                onLoggedIn={() => setLoaded(true)}
              />
            )
          )}
        </Suspense>
      </Stack>
    </AppShell>
  );
};

export default DashboardBase;
