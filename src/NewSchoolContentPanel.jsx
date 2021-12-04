import { PageHeader, Button, Descriptions, List, Row, Col, Empty, Form, Modal, Input, Space, Table } from "antd";
import { FullscreenOutlined, FormOutlined, DeleteOutlined, CloseOutlined, RightOutlined, SelectOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import "./NewSchoolContentPanel.css";

const NewSchoolContentPanel = (props) => {
  const [newClassModalIsVisible, setNewClassModalIsVisible] = useState(false);
  const [newClassModalIsLoading, setNewClassModalIsLoading] = useState(false);
  const [newClassForm] = Form.useForm();

  const columns = [
    {
      title: "Classe",
      dataIndex: "name",
      key: "_id",
      render: (idx, record) => <a href={`/#/dashboard?panel=class&id=${record._id}`}>{record.name}</a>,
    },
    {
      title: "Séances",
      dataIndex: "sessions",
      key: "_id",
      render: (index, record) => record.sessions.length,
    },
    {
      title: "Actions",
      dataIndex: "_id",
      key: "_id",
      render: (index, record) => (
        <a>
          <DeleteOutlined
            onClick={(e) => {
              onDeleteClass(record);
            }}
          />
        </a>
      ),
      width: 40,
    },
  ];

  const showNewClassModal = () => {
    setNewClassModalIsVisible(true);
  };

  const onNewClassModalCancel = () => {
    setNewClassModalIsVisible(false);
  };

  const onNewClassModalOk = () => {
    newClassForm.submit();
  };

  const OnNewClassFormFinish = (value) => {
    console.log(value);
    setNewClassModalIsLoading(true);
    fetch(`/api/classes/${props.data._id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    }).then((res) => {
      if (res.status == 200) {
        setNewClassModalIsVisible(false);
        setNewClassModalIsLoading(false);
        props.onUpdate();
      }
    });
  };

  const onDeleteClassModalConfirm = (clss) => {
    fetch(`/api/classes/${clss._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    }).then((res) => {
      if (res.status == 200) {
        console.log("Class successfully deleted");
        props.onUpdate();
      }
    });
  };

  const onDeleteClass = (clss) => {
    Modal.confirm({
      title: "Avertissement",
      content: (
        <p>
          Vous êtes sur le point de supprimer la classe <strong>{clss.name}</strong> pour l'établissement <strong>{props.data.name}</strong>
          . Cela entrainera la suppression de toutes les données qui lui sont relatives. <br />
          <br />
          Êtes vous sûr de vouloir continuer ?
        </p>
      ),
      onOk: () => {
        onDeleteClassModalConfirm(clss);
      },
      okText: "Oui, supprimer",
      cancelText: "Non, annuler",
    });
  };

  const OnDeleteSchool = () => {
    Modal.confirm({
      title: "Avertissement",
      content: (
        <p>
          Vous êtes sur le point de supprimer l'établissement <strong>{props.data.name}</strong>. Cela entrainera la suppression de toutes
          les données qui lui sont relatives. <br />
          <br />
          Êtes vous sûr de vouloir continuer ?
        </p>
      ),
      onOk: onDeleteSchoolModalConfirm,
      okText: "Oui, supprimer",
      cancelText: "Non, annuler",
    });
  };

  const onDeleteSchoolModalConfirm = () => {
    fetch(`/api/schools/${props.data._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    }).then((res) => {
      if (res.status == 200) {
        console.log("School successfully deleted");
        props.onUpdate();
      }
    });
  };

  return (
    <>
      <PageHeader
        ghost={false}
        onBack={() => window.history.back()}
        title={props.data.name}
        subTitle={props.data.city}
        extra={[
          <Button key="2" onClick={OnDeleteSchool}>
            Supprimer
          </Button>,
          <Button key="1" type="primary" onClick={showNewClassModal}>
            Nouvelle classe
          </Button>,
        ]}
      >
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="Nombre de classes">{props.data.classes.length}</Descriptions.Item>
          <Descriptions.Item label="Classes">
            {props.data.classes.map((cls, idx) => `${idx == 0 ? "" : ", "}${cls.name}`)}
          </Descriptions.Item>
        </Descriptions>
      </PageHeader>
      <div className="list-container">
        <Table
          columns={columns}
          locale={{
            emptyText: <Empty description="Aucune balise"></Empty>,
          }}
          dataSource={props.data.classes}
          size="small"
          pagination={false}
        ></Table>
      </div>
      <Modal
        title="Nouvelle Classe"
        cancelText="Annuler"
        okText="Enregistrer"
        visible={newClassModalIsVisible}
        onOk={onNewClassModalOk}
        confirmLoading={newClassModalIsLoading}
        onCancel={onNewClassModalCancel}
        destroyOnClose
      >
        <Form layout="vertical" form={newClassForm} onFinish={OnNewClassFormFinish} preserve={false}>
          <Form.Item
            label="Nom ou numero de la classe"
            name="name"
            rules={[{ required: true, message: "Nom ou numero de classe manquant" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NewSchoolContentPanel;
