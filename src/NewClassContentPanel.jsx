import {
  PageHeader,
  Button,
  Descriptions,
  List,
  Row,
  Col,
  Empty,
  Form,
  Modal,
  Input,
  Divider,
  Avatar,
  Table,
  DatePicker,
  Spin,
} from "antd";
import { useState, useEffect } from "react";
import "./NewClassContentPanel.css";
import AntEditableTable from "./AntEditableTable";
import { PlusOutlined } from "@ant-design/icons";

const { Search } = Input;

const NewClassContentPanel = (props) => {
  const [addStudentFormOpened, setAddStudentFormOpened] = useState(false);
  const [newSessionModalIsVisible, setNewSessionModalIsVisible] = useState(false);
  const [newSessionModalIsLoading, setNewSessionModalIsLoading] = useState(false);
  const [students, setStudents] = useState([
    { firstName: "Clement", lastName: "Guenier", _id: "uytuy", vma: 12 },
    { firstName: "Ilona", lastName: "Bussod", _id: "nfcvc", vma: 12 },
    { firstName: "Alexane", lastName: "Iwochewitsch", _id: "aaaa", vma: 12 },
    { firstName: "Melvin", lastName: "Fribourg", _id: "jytfg", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qwec", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qweasdc", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qwexxac", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qwzxcec", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qweqdaxc", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qwghjghec", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qwxaxxsec", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qweityuc", vma: 12 },
    { firstName: "Aziza", lastName: "Chebil", _id: "qwec", vma: 12 },
  ]);
  const [newSessionForm] = Form.useForm();
  const [isEditingStudent, setIsEditingStudent] = useState(false);

  const showNewSessionModal = () => {
    setNewSessionModalIsVisible(true);
  };

  const onNewSessionModalCancel = () => {
    setNewSessionModalIsVisible(false);
  };

  const onNewSessionModalOk = () => {
    newSessionForm.submit();
  };

  const OnNewSessionFormFinish = (value) => {
    console.log(value.date.format("DD/MM/YYYY"));
    setNewSessionModalIsLoading(true);
    fetch(`/api/sessions?class_id=${props.data._id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: value.date.format("DD/MM/YYYY"),
        session_name: value.name,
      }),
    }).then((res) => {
      if (res.status == 200) {
        setNewSessionModalIsVisible(false);
        setNewSessionModalIsLoading(false);
        props.onUpdate();
      }
    });
  };

  const columns = [
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
          Supprimer
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
      render: (_, record) => <Avatar src={`https://avatars.dicebear.com/api/bottts/${record.lastName}.svg`} />,
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

  const onDeleteClassConfirm = () => {
    fetch(`/api/classes/${props.data._id}`, {
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

  const onDeleteSessionConfirm = (sess) => {
    fetch(`/api/sessions/${sess._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    }).then((res) => {
      if (res.status == 200) {
        console.log("Session successfully deleted");
        props.onUpdate();
      }
    });
  };

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

  useEffect(() => {
    if (!props.data) return;
    setStudents(props.data.students);
  }, [props.data]);

  const onSave = (student) => {
	  console.log("student", student)
	setIsEditingStudent(false)
    if (student._id === "__new") {
      fetch(`/api/classes/${props.data._id}/students`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(student),
      }).then((res) => {
        if (res.status == 200) {
          props.onUpdate();
        }
      });
    } else {
		console.log("PUT")
		fetch(`/api/classes/${props.data._id}/students`, {
			method: "PUT",
			headers: {
			  Accept: "application/json",
			  "Content-Type": "application/json",
			},
			body: JSON.stringify(student),
		  }).then((res) => {
			if (res.status == 200) {
			  props.onUpdate();
			}
		  });
    }
  };

  const onDelete = (student) => {
	fetch(`/api/classes/${props.data._id}/students`, {
		method: "DELETE",
		headers: {
		  Accept: "application/json",
		  "Content-Type": "application/json",
		},
		body: JSON.stringify(student),
	  }).then((res) => {
		if (res.status == 200) {
		  props.onUpdate();
		}
	  });
  }

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
                <Search placeholder="Rechercher" onSearch={() => {}} style={{ marginBottom: "20px" }} />
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
              columns={columns}
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
