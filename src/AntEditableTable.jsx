import React, { useState, useEffect, useRef } from "react";
import { Table, Input, InputNumber, Popconfirm, Form, Typography } from "antd";
import { FormOutlined, CloseOutlined, CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import "./AntEditableTable.css";
const originData = [];

for (let i = 0; i < 100; i++) {
  originData.push({
    key: i.toString(),
    name: `Edrward ${i}`,
    age: 32,
    address: `London Park no. ${i}`,
  });
}

const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
  const inputNode = inputType === "number" ? <InputNumber /> : <Input />;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: false,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const EditableTable = (props) => {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [editingKey, setEditingKey] = useState("");
  const [scroll, setScroll] = useState(false);
  const tableRef = useRef();

  const isEditing = (record) => record._id === editingKey;

  const edit = (record) => {
    props.onEdit();
    form.setFieldsValue({
      ...record,
    });
    console.log(record);
    setEditingKey(record._id);
  };

  const cancel = () => {
    if (editingKey === "__new") props.onCancelNew();
    props.onCancel();
    setEditingKey("");
  };

  useEffect(() => {
    if (!props.data) return;
    setData(props.data);
	console.log("props.data", props.data)
    if (props.data.filter((s) => s._id === "__new").length) {
		edit(props.data.filter((s) => s._id === "__new")[0]);
		setScroll((curr) => !curr) // change the state of 'scroll' to trigger useEffect on the next render which calls e.scrollIntoView()
	}
  }, [props.data]);

  useEffect(() => {
    if (editingKey === "__new") tableRef.current.scrollIntoView({behavior: "smooth"});
  }, [scroll]);

  useEffect(() => {
    if (!props.columns) return;
    const cols = [
      ...props.columns,
      {
        title: "Actions",
        dataIndex: "actions",
        width: "15%",
        render: (_, record) => {
          const editable = isEditing(record);
          return editable ? (
            <span>
              <a
                href="javascript:;"
                onClick={() => save(record)}
                style={{
                  marginRight: 8,
                }}
              >
                <CheckOutlined />
              </a>
              <a href="javascript:;" onClick={cancel}>
                <CloseOutlined />
              </a>
            </span>
          ) : (
            <>
              <Typography.Link
                disabled={editingKey !== ""}
                onClick={() => {
                  edit(record);
                }}
              >
                <FormOutlined />
              </Typography.Link>
              <Typography.Link disabled={editingKey !== ""} onClick={() => del(record)} style={{ marginLeft: 8 }}>
                <DeleteOutlined />
              </Typography.Link>
            </>
          );
        },
      },
    ];
    console.log("before");
    setColumns(
      cols.map((col) => {
        if (!col.editable) {
          return col;
        }
        console.log("here");

        return {
          ...col,
          onCell: (record) => ({
            record,
            inputType: col.dataIndex === "age" ? "number" : "text",
            dataIndex: col.dataIndex,
            title: col.title,
            editing: isEditing(record),
          }),
        };
      })
    );
  }, [props.columns, editingKey]);

  const save = async (student) => {
    try {
      const row = await form.validateFields();
      props.onSave({ ...form.getFieldsValue(), _id: student._id });
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
    setEditingKey("");
  };

  const del = (student) => {
	  props.onDelete(student);
  }

  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        size={props.size}
        bordered={props.bordered}
        dataSource={data}
        columns={columns}
        rowClassName="editable-row"
        pagination={false}
        scroll={{ y: "100%" }}
        className="fixed-header-full-height-table"
        locale={props.locale}
        onRow={(_, index) => {
          if (index === data.length - 1) {
            return {
              ref: tableRef,
            };
          }
        }}
      />
    </Form>
  );
};

export default EditableTable;
