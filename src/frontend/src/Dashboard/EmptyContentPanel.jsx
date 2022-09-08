import { useState } from "react";
import { Button, Modal, Form, Input } from "antd";
import "./EmptyContentPanel.css";
import drawing from "../assets/conifer-branches-all-over-the-world.png";

const DashboardContentPanel = (props) => {
  const [newSchoolModalIsVisible, setNewSchoolModalIsVisible] = useState(false);
  const [newSchoolModalIsLoading, setNewSchoolModalIsLoading] = useState(false);
  const [newSchoolForm] = Form.useForm();

  const showNewSchoolModal = () => {
    setNewSchoolModalIsVisible(true);
  };

  const onNewSchoolModalCancel = () => {
    setNewSchoolModalIsVisible(false);
  };

  const onNewSchoolModalOk = () => {
    newSchoolForm.submit();
  };

  const OnNewSchoolFormFinish = (value) => {
    console.log(value);
    setNewSchoolModalIsLoading(true);
    fetch("/api/schools/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    }).then((res) => {
      if (res.status === 200) {
        setNewSchoolModalIsVisible(false);
        setNewSchoolModalIsLoading(false);
		props.onUpdate();
      }
    });
  };

  return (
    <div className="no-selected-drawing">
      <img src={drawing} alt="" />
      <span>Selectionez un etablissement, une classe ou une seance.</span>
      <br></br>
      <Button size="small" onClick={showNewSchoolModal}>
        Nouvel Etablissement
      </Button>
      <div className="drawing-attribution">
        Illustration by <a href="https://icons8.com/illustrations/author/6023ee3f123f99199963c90f">Елизавета Губа</a> from{" "}
        <a href="https://icons8.com/illustrations">Ouch!</a>
      </div>
      <Modal
        title="Nouvel Etablissement"
        cancelText="Annuler"
        okText="Enregistrer"
        visible={newSchoolModalIsVisible}
        onOk={onNewSchoolModalOk}
        confirmLoading={newSchoolModalIsLoading}
        onCancel={onNewSchoolModalCancel}
      >
        <Form layout="vertical" form={newSchoolForm} onFinish={OnNewSchoolFormFinish}>
          <Form.Item label="Nom de l'etablissement" name="name" rules={[{ required: true, message: "Please input your username!" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Ville" name="city" rules={[{ required: false, message: "Please input your username!" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DashboardContentPanel;
