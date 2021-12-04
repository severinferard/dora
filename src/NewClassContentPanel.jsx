import { PageHeader, Button, Descriptions, Row, Col, Empty, Form, Modal, Input, Divider, Avatar, Table, DatePicker } from "antd";
import { useState, useEffect } from "react";
import "./NewClassContentPanel.css";
import AntEditableTable from "./AntEditableTable";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Search } = Input;

const NewClassContentPanel = (props) => {
  const [newSessionModalIsVisible, setNewSessionModalIsVisible] = useState(false);
  const [newSessionModalIsLoading, setNewSessionModalIsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [newSessionForm] = Form.useForm();
  const [isEditingStudent, setIsEditingStudent] = useState(false);

  const sessionsTableColumns = [
    {
      title: "Seance",
      dataIndex: "session_name",
      key: "session_name",
      render: (text, record) => <a href={`/#/dashboard?panel=session&id=${record._id}`}>{text}</a>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Balises",
      dataIndex: "beacons",
      key: "beacons",
      render: (b) => b.length,
      width: 80,
    },
    {
      title: "Courses",
      dataIndex: "runs",
      key: "runs",
      render: (r) => r.length,
      width: 80,
    },
    {
      title: "Actions",
      dataIndex: "deleteData",
      key: "actions",
      render: (sess) => (
        <a
          onClick={() => {
            onDeleteSession(sess);
          }}
        >
          <DeleteOutlined />
        </a>
      ),
    },
  ];

  const studentColumns = [
    {
      title: "",
      dataIndex: "avatar",
      editable: false,
      width: "10%",
      render: (_, record) => <Avatar src={`/avatars/bottts${record.avatar}.svg`} />,
    },
    {
      title: "Nom",
      dataIndex: "lastName",
      editable: true,
      width: "30%",
    },
    {
      title: "Prénom",
      dataIndex: "firstName",
      editable: true,
      width: "30%",
    },
    {
      title: "VMA",
      dataIndex: "vma",
      editable: true,
      width: "15%",
    },
  ];

  // Set the 'students' array state up on data loaded.
  useEffect(() => {
    if (!props.data) return;
    setStudents(props.data.students);
  }, [props.data]);

  // Called when the 'Nouvelle Seance' button is clicked.
  const showNewSessionModal = () => {
    setNewSessionModalIsVisible(true);
  };

  // Called when the 'Nouvelle seance' cancel button is pressed.
  const onNewSessionModalCancel = () => {
    setNewSessionModalIsVisible(false);
  };

  // Called when the 'Nouvelle seance' OK button is pressed. Submit the form.
  const onNewSessionModalOk = () => {
    newSessionForm.submit();
  };

  // Called when the 'Nouvelle seance' form is sunmited. Send data to server.
  const OnNewSessionFormFinish = async (value) => {
    setNewSessionModalIsLoading(true);
    const res = await fetch(`/api/sessions?class_id=${props.data._id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: value.date.format("DD/MM/YYYY"),
        session_name: value.name,
      }),
    });

    if (res.status == 200) {
      setNewSessionModalIsVisible(false);
      setNewSessionModalIsLoading(false);
      props.onUpdate();
    }
  };

  // Delete a class
  const onDeleteClassConfirm = async () => {
    const res = await fetch(`/api/classes/${props.data._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    });

    if (res.status == 200) {
      console.log("Class successfully deleted");
      props.onUpdate();
    }
  };

  // Prompt the user for confimation up on clicked on the "Delete class" button.
  const onDeleteClass = () => {
    Modal.confirm({
      title: "Avertissement",
      content: (
        <p>
          Vous êtes sur le point de supprimer la classe <strong>{props.data.name}</strong> pour l'établissement{" "}
          <strong>{props.data.school_name}</strong>
          . Cela entrainera la suppression de toutes les données qui lui sont relatives. <br />
          <br />
          Êtes vous sûr de vouloir continuer ?
        </p>
      ),
      onOk: () => {
        onDeleteClassConfirm();
      },
      okText: "Oui, supprimer",
      cancelText: "Non, annuler",
    });
  };

  // Delete a session.
  const onDeleteSessionConfirm = async (sess) => {
    const res = await fetch(`/api/sessions/${sess._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    });

    if (res.status == 200) {
      console.log("Session successfully deleted");
      props.onUpdate();
    }
  };

  // Prompt the user for confimation up on clicked on the "Delete session" button.
  const onDeleteSession = (sess) => {
    Modal.confirm({
      title: "Avertissement",
      content: (
        <p>
          Vous êtes sur le point de supprimer la séance <strong>{sess.session_name}</strong> pour la classe{" "}
          <strong>{props.data.name}</strong>
          . Cela entrainera la suppression de toutes les données qui lui sont relatives. <br />
          <br />
          Êtes vous sûr de vouloir continuer ?
        </p>
      ),
      onOk: () => {
        onDeleteSessionConfirm(sess);
      },
      okText: "Oui, supprimer",
      cancelText: "Non, annuler",
    });
  };

  // Called when an edit in the student table is saved. If the student._id === '__new', the edit is a new student that needs to be created.
  const onSave = async (student) => {
	  console.log("student", student)
    setIsEditingStudent(false);
    if (student._id === "__new") {
      const res = await fetch(`/api/classes/${props.data._id}/students`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(student),
      });
      if (res.status == 200) props.onUpdate();
    } else {
      const res = await fetch(`/api/classes/${props.data._id}/students`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(student),
      });
      if (res.status == 200) props.onUpdate();
    }
  };

  // Called when the delete student button is clicked
  const onDelete = async (student) => {
    const res = await fetch(`/api/classes/${props.data._id}/students`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(student),
    });
    if (res.status == 200) props.onUpdate();
  };

  const onSearch = (e) => {
    const val = e.nativeEvent.target.value;
    if (val === "") setStudents(props.data.students);
    setStudents(
      props.data.students.filter((stud) => 
	  	stud.firstName.toLowerCase().includes(val)
		|| stud.lastName.toLowerCase().includes(val))
    );
  };

  return (
    <div className="class-panel-wrapper">
      <PageHeader
        ghost={false}
        onBack={() => window.history.back()}
        title={props.data.name}
        subTitle={props.data.school_name}
        extra={[
          <Button key="2" onClick={onDeleteClass}>
            Supprimer
          </Button>,
          <Button key="1" type="primary" onClick={showNewSessionModal}>
            Nouvelle Seance
          </Button>,
        ]}
      >
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="Nombre de séances">{props.data.sessions.length}</Descriptions.Item>
          <Descriptions.Item label="Séances">
            {props.data.sessions.map((sess, idx) => `${idx == 0 ? "" : ", "}${sess.session_name}`)}
          </Descriptions.Item>
          <Descriptions.Item label="Nombre d'élèves">{0}</Descriptions.Item>
        </Descriptions>
      </PageHeader>
      <Row>
        <Col span={12}>
          <div className="student-col-wrapper">
            <div className="student-col-inner">
              <div className="student-searchbox">
                <Search placeholder="Rechercher" onChange={onSearch} style={{ marginBottom: "20px" }} />
              </div>
              <div className="student-table-wrapper">
                <AntEditableTable
                  size="small"
                  columns={studentColumns}
                  data={students}
                  onCancelNew={() => setStudents(students.filter((s) => s._id !== "__new"))}
                  onEdit={() => {
                    setIsEditingStudent(true);
                  }}
                  onCancel={() => setIsEditingStudent(false)}
                  locale={{
                    emptyText: <Empty description="Aucun élève renseigné"></Empty>,
                  }}
                  onSave={onSave}
                  onDelete={onDelete}
                  rowClassName={"student-table-row"}
                  onRow={(record, rowIndex) => {
                    return {
                      onClick: (event) => {
                        console.log("click");
                        window.location.href = `/#/student-summary/${record._id}`;
                      },
                    };
                  }}
                ></AntEditableTable>
              </div>
              <div className="student-new">
                <Button
                  type="dashed"
                  onClick={() => {}}
                  block
                  disabled={isEditingStudent}
                  icon={<PlusOutlined />}
                  style={{ marginTop: "20px" }}
                  onClick={() => {
                    setStudents([...students, { firstName: "", lastName: "", vma: "", _id: "__new" }]);
                  }}
                >
                  Ajouter un élève
                </Button>
              </div>
            </div>
            <Divider type="vertical"></Divider>
          </div>
        </Col>
        <Col span={12}>
          <div className="session-list-wrapper">
            <Table
              columns={sessionsTableColumns}
              dataSource={props.data.sessions.map((sess) => {
                return { ...sess, deleteData: sess, key: sess._id };
              })}
              size="small"
              pagination={false}
              scroll={{ y: "100%" }}
              locale={{
                emptyText: (
                  <Empty description="Aucune seance renseignée">
                    <Button size="small" onClick={() => {}}>
                      Nouvelle seance
                    </Button>
                  </Empty>
                ),
              }}
            />
          </div>
        </Col>
      </Row>
      <Modal
        title="Nouvelle Séance"
        cancelText="Annuler"
        okText="Enregistrer"
        visible={newSessionModalIsVisible}
        onOk={onNewSessionModalOk}
        confirmLoading={newSessionModalIsLoading}
        onCancel={onNewSessionModalCancel}
        destroyOnClose
      >
        <Form layout="vertical" form={newSessionForm} onFinish={OnNewSessionFormFinish} preserve={false}>
          <Form.Item
            label="Nom ou numero de la séance"
            name="name"
            rules={[
              {
                required: true,
                message: "Nom ou numero de la séance manquant",
              },
            ]}
          >
            <Input placeholder="Seance 4" />
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true, message: "Date manquante" }]}>
            <DatePicker placeholder="Date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NewClassContentPanel;
