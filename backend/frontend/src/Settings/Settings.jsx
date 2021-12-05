import { useState } from "react";
import {
  PageHeader,
  Button,
  Row,
  Modal,
  Progress,
  Card,
} from "antd";

import { useTimer } from "react-timer-hook";
import { PoweroffOutlined } from "@ant-design/icons";
import "./Settings.css";

const Settings = (props) => {
  const [isPowerOffModalVisible, setIsPowerOffModalVisible] = useState(false);
  const [isPowerOffConfirmModalVisible, setIsPowerOffConfirmModalVisible] = useState(false);
  const timer = useTimer(Date.now());

  const powerOff = async () => {
      fetch(`/api/settings/shutdown`, { method: "GET" });
      const time = new Date();
      time.setSeconds(time.getSeconds() + 60);
      timer.restart(time);
      setIsPowerOffConfirmModalVisible(false);
      setTimeout(() => {
        setIsPowerOffModalVisible(true);
      }, 1000);
  };

  return (
    <div id="settings-page-wrapper">
      <PageHeader onBack={() => window.history.back()} title="Réglages"></PageHeader>
      <div id="settings-container">
        <Row>
          <Card title="Alimentation" size="small" style={{ width: "100%", textAlign: "left" }}>
            <Button type="primary" icon={<PoweroffOutlined />} onClick={() => setIsPowerOffConfirmModalVisible(true)}>
              Eteindre
            </Button>
          </Card>
        </Row>
      </div>
      <Modal
        title="Attention"
        visible={isPowerOffConfirmModalVisible}
        okText="Oui, éteindre"
        cancelText="Non, annuler"
        onOk={powerOff}
        onCancel={() => setIsPowerOffConfirmModalVisible(false)}
      >
        <p>Vous êtes sur le point d'éteindre le serveur. Voulez vous vraiment continuer ?</p>
      </Modal>
      <Modal title="Extinction en court..." visible={isPowerOffModalVisible} footer={null} closable={false}>
        <p>Pour s'assurer que vos données ne soit pas perdues, merci d'attendre 1 minute avant de débrancher le serveur.</p>
        <div id="timer-wrapper">
          <Progress
            type="circle"
            percent={timer.seconds > 0 ? (timer.seconds / 60) * 100 : 100}
            format={() => (timer.seconds > 0 ? `${timer.seconds}` : "OK")}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
