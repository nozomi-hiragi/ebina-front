import { Checkbox, Table } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

const MembersTable = (props: {
  members: any[];
  myID?: string;
  onChange: (selected: string[]) => void;
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const membersWOM = useMemo(
    () => props.members.filter((member) => member.id !== props?.myID),
    [props.members, props.myID],
  );
  const isCheckedAll = useMemo(
    () => selected.length !== 0 && selected.length === membersWOM.length,
    [selected, membersWOM],
  );
  const hasSelect = useMemo(() => selected.length > 0, [selected]);
  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name" },
  ];
  useEffect(() => {
    setSelected(selected
      .filter((id) => props.members.find((member) => member.id === id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.members]);
  return (
    <Table>
      <thead>
        <tr>
          <th>
            <Checkbox
              onChange={() => {
                const newValue = isCheckedAll
                  ? []
                  : membersWOM.map((member) => member.id);
                setSelected(newValue);
                props.onChange(newValue);
              }}
              checked={isCheckedAll}
              indeterminate={hasSelect && !isCheckedAll}
            />
          </th>
          {columns.map((field) => (
            <th key={field.field}>
              {field.headerName}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.members.map((member) => (
          <tr key={member.id}>
            <td>
              <Checkbox
                disabled={props.myID === member.id}
                checked={selected.includes(member.id)}
                onChange={({ currentTarget: { checked } }) => {
                  const newValue = checked
                    ? [...selected, member.id]
                    : selected.filter((v) => member.id !== v);
                  setSelected(newValue);
                  props.onChange(newValue);
                }}
              />
            </td>
            <td>{member.id}</td>
            <td>{member.name}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default MembersTable;
