import { Button, Group, NumberInput, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRecoilValue } from "recoil";
import { Switch } from "tabler-icons-react";
import { newRoute, NginxConf } from "../../EbinaAPI/routing";
import { tokenSelector } from "../../recoil/user";

const NewRouteForm = ({ onSave, onCancel }: {
  onSave: (name: string) => void;
  onCancel: () => void;
}) => {
  const authToken = useRecoilValue(tokenSelector);
  const routeForm = useForm<NginxConf & { name: string; isKoujou: boolean }>({
    initialValues: { name: "", hostname: "", port: 0, isKoujou: false },
  });
  return (
    <form
      onSubmit={routeForm.onSubmit(({ name, isKoujou, port, ...values }) => {
        const newConf = { ...values, port: isKoujou ? "koujou" : port };
        newRoute(authToken, name, newConf).then((ret) => {
          if (ret) {
            onSave(name);
            routeForm.reset();
          } else {
            alert("already");
          }
        }).catch((err) => {
          alert(err);
        });
      })}
    >
      <TextInput
        label="Name"
        placeholder=""
        {...routeForm.getInputProps("name")}
      />
      <TextInput
        label="Hostname"
        placeholder="example.com"
        {...routeForm.getInputProps("hostname")}
      />
      {!routeForm.values.isKoujou
        ? (
          <NumberInput
            label="Port"
            placeholder="3456"
            {...routeForm.getInputProps("port")}
          />
        )
        : <TextInput label="Port" value="koujou" disabled />}
      <Switch
        label="Port for Koujou"
        mt="sm"
        {...routeForm.getInputProps("isKoujou", { type: "checkbox" })}
      />
      <Group position="right" mt="md">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </Group>
    </form>
  );
};

export default NewRouteForm;
