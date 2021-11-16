import { PageHeader, Button, Descriptions, List, Row, Col, Empty, Form, Modal, Input } from "antd";
import { useState, useEffect } from "react";
import "./NewSchoolContentPanel.css";

const NewSchoolContentPanel = (props) => {
  const [newClassModalIsVisible, setNewClassModalIsVisible] = useState(false);
  const [newClassModalIsLoading, setNewClassModalIsLoading] = useState(false);
  const [newClassForm] = Form.useForm();

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
        <List
          itemLayout="horizontal"
          size="small"
          dataSource={props.data.classes}
          locale={{
            emptyText: (
              <Empty description="Aucune classe renseignée">
                <Button size="small" onClick={showNewClassModal}>
                  Nouvelle classe
                </Button>
              </Empty>
            ),
          }}
        >
          {props.data.classes.map((item) => {
            return (
              <List.Item
                key={item._id}
                actions={[
                  <a key="list-loadmore-edit">Voir</a>,
                  <a
                    key="list-loadmore-edit"
                    onClick={() => {
                      onDeleteClass(item);
                    }}
                  >
                    Supprimer
                  </a>,
                ]}
              >
                <Row style={{ width: "100%" }}>
                  <Col span={12}>{item.name}</Col>
                  <Col span={12}>
                    {item.sessions.length > 1
                      ? `${item.sessions.length} séances enregistrées`
                      : `${item.sessions.length} séance enregistrée`}
                  </Col>
                </Row>
              </List.Item>
            );
          })}
        </List>
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
          <Form.Item label="Nom ou numero de la classe" name="name" rules={[{ required: true, message: "Nom ou numero de classe manquant" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NewSchoolContentPanel;
