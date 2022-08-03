import { Button, Group, Stack, Tabs } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EbinaAPI from "../../EbinaAPI";

const Database = () => {
  const [dbNames, setDBNames] = useState<string[]>([]);
  const [colNames, setColNames] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    const promises: Promise<any>[] = [];
    let newDBNames: string[];
    const newColNames = colNames;
    EbinaAPI.getDatabases().then((ret) => {
      newDBNames = ret.map((it) => {
        promises.push(
          EbinaAPI.getCollections(it.name).then((ret) =>
            newColNames[it.name] = ret
          ),
        );
        return it.name;
      });
    }).then(() => {
      Promise.all(promises).then(() => {
        setColNames(newColNames);
        setDBNames(newDBNames);
      });
    }).catch((err) => {
      console.error(err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack>
      <Tabs orientation="vertical">
        <Tabs.List>
          {dbNames.map((name) => {
            return (
              <Tabs.Tab key={name} value={name}>
                {name}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
        {dbNames.map((dbName) => {
          return (
            <Tabs.Panel key={dbName} value={dbName} pl="xs">
              <Group>
                {colNames[dbName].map((colName) => {
                  return (
                    <Button<typeof Link>
                      key={colName}
                      component={Link}
                      to={`${dbName}/${colName}`}
                    >
                      {colName}
                    </Button>
                  );
                })}
              </Group>
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Stack>
  );
};

export default Database;
