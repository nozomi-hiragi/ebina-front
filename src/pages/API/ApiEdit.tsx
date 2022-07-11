import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { Button, Container, Group, Modal, Select, TextInput, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import EbinaAPI from "../../EbinaAPI";
import { useRecoilValue } from "recoil";
import { appNameSelector, getJsListSelector } from "../../atoms";
import { ApiMethodList, ApiTypeList, TypeApiMethods, TypeApiTypes } from "../../types";

function useQuery() {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

var cacheAppName = ''

const ApiEdit = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const jsList = useRecoilValue(getJsListSelector)
  const appName = useRecoilValue(appNameSelector)
  const navigate = useNavigate()
  if (!cacheAppName) cacheAppName = appName

  const query = useQuery()
  const queryPath = query.get('path')

  useEffect(() => {
    if (queryPath) {
      EbinaAPI.getAPI(appName, queryPath).then((api) => {
        switch (api.type) {
          case 'JavaScript':
            const args = api.value.split('>')
            editApiForm.setFieldValue("jsfilename", args[0])
            editApiForm.setFieldValue("jsfunction", args[1])
            break;
        }
        editApiForm.setFieldValue("path", queryPath)
        editApiForm.setFieldValue("name", api.name)
        editApiForm.setFieldValue("method", api.method)
        editApiForm.setFieldValue("type", api.type)
        editApiForm.setFieldValue("value", api.value)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPath])

  useEffect(() => {
    if (cacheAppName !== appName) {
      cacheAppName = appName
      navigate('..')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appName])

  const editApiForm = useForm({
    initialValues: {
      path: queryPath ?? "",
      name: "",
      method: "get" as TypeApiMethods,
      type: "static" as TypeApiTypes,
      value: "",
      jsfilename: '',
      jsfunction: '',
    },
  });

  return (
    <Container m={1}>
      <form onSubmit={editApiForm.onSubmit((values) => {
        switch (values.type) {
          case 'JavaScript':
            values.value = `${values.jsfilename}>${values.jsfunction}`
            break;
        }
        if (queryPath) {
          EbinaAPI.updateAPI(appName, values.path, values).then((res) => { navigate('..') })
        } else {
          EbinaAPI.createPath(appName, values.path, values).then((res) => { navigate('..') })
        }
      })}>
        <TextInput
          label="Path"
          placeholder="Path"
          required={queryPath == null}
          disabled={queryPath !== null}
          {...editApiForm.getInputProps('path')}
        />
        <TextInput
          label="Name"
          placeholder="Name"
          required
          {...editApiForm.getInputProps('name')}
        />
        <Select
          label="Method"
          placeholder="Pick one"
          data={ApiMethodList}
          {...editApiForm.getInputProps('method')}
        />
        <Select
          label="Type"
          placeholder="Pick one"
          data={ApiTypeList}
          {...editApiForm.getInputProps('type')}
        />
        {editApiForm.values.type === 'JavaScript'
          ? <>
            <Select
              label="JsFile"
              placeholder="Pick one"
              data={jsList}
              required={editApiForm.values.type === 'JavaScript'}
              {...editApiForm.getInputProps('jsfilename')}
            />
            <TextInput
              label="Function"
              placeholder="Function"
              required={editApiForm.values.type === 'JavaScript'}
              {...editApiForm.getInputProps('jsfunction')}
            />
          </>
          :
          <TextInput
            label="Value"
            placeholder="Value"
            required={editApiForm.values.type === 'static'}
            {...editApiForm.getInputProps('value')}
          />
        }
        <Group position="right" mt="md">
          <Button disabled={queryPath === null} onClick={() => { setDeleteDialogOpen(true) }}>Delete</Button>
          <Button type="submit">Save</Button>
        </Group>
      </form>
      <Modal
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={`Delete ${appName} API`}
      >
        <Text color="red">{`Delete "${queryPath}"?`}</Text>
        <Group position="right">
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={(() => {
            EbinaAPI.deleteAPI(appName, queryPath!).then(() => {
              setDeleteDialogOpen(false)
              navigate('..')
            }).catch((err) => { console.log(err) })
          })}>Delete</Button>
        </Group>
      </Modal>
    </Container >
  )
}

export default ApiEdit
