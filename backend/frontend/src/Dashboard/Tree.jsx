import { useState, useEffect } from "react";
import { Tree, Input } from "antd";
import "./Tree.css";

const { Search } = Input;
const dataList = [];
const MyTree = (props) => {
  const [isInitial, setIsInitial] = useState(true);
  const [treeContent, setTreeContent] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [autoExpandedParent, setAutoexpandedParent] = useState(true);

  const getInitialExpandedItems = () => {
    const expanded = [];
    let curr = props.selected;

    while (curr !== undefined) {
      curr = getParentKey(curr, treeContent);
      if (curr !== undefined) expanded.push(curr);
    }
    return (expanded);
  };

  const onExpand = (expandedKeys) => {
    console.log(expandedKeys);
    setExpandedKeys(expandedKeys);
    setAutoexpandedParent(false);
  };
  const generateList = (data) => {
    for (let i = 0; i < data.length; i++) {
      const node = data[i];
      const { title, key } = node;
      dataList.push({ key, title });
      if (node.children) {
        generateList(node.children);
      }
    }
  };

  const onChange = (e) => {
    const { value } = e.target;
    let expandedKeys;
    if (value === "") {
		expandedKeys = getInitialExpandedItems();
    } else {
      expandedKeys = dataList
        .map((item) => {
          if (item.title.toLowerCase().indexOf(value.toLowerCase()) > -1) {
            return getParentKey(item.key, treeContent);
          }
          return null;
        })
        .filter((item, i, self) => item && self.indexOf(item) === i);
    }
	console.log(expandedKeys)
    setExpandedKeys(expandedKeys);
    setSearchValue(value);
    setAutoexpandedParent(true);
  };

  const getParentKey = (key, tree) => {
    let parentKey;
    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];
      if (node.children) {
        if (node.children.some((item) => item.key === key)) {
          parentKey = node.key;
        } else if (getParentKey(key, node.children)) {
          parentKey = getParentKey(key, node.children);
        }
      }
    }
    return parentKey;
  };

  useEffect(() => {
    setTreeContent(
      props.treeData.map((school) => {
        let schoolChildren = school.classes.map((clss) => {
          let classChildren = clss.sessions.map((sess) => {
            let sessionChildren = sess.runs.map((run) => {
              return {
                title: run.id,
                key: run._id,
                type: "run",
                data: run,
              };
            });
            return {
              title: sess.session_name,
              key: sess._id,
              children: sessionChildren,
              type: "session",
              data: sess,
            };
          });
          return {
            title: clss.name,
            key: clss._id,
            children: classChildren,
            type: "class",
            data: clss,
          };
        });
        return {
          title: school.name,
          key: school._id,
          children: schoolChildren,
          type: "school",
          data: school,
        };
      })
    );
  }, [props.treeData]);

//   generate the node list and make sure that if the page is opened with a panel selected, all parents of the selected node are expanded in the tree
  useEffect(() => {
    if (!treeContent.length) return;
	generateList(treeContent)

    if (isInitial) {
      setIsInitial(false);
      if (!props.selected) return;
      setExpandedKeys(getInitialExpandedItems());
    }
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeContent]);

  const loop = (data) => {
    return data.map((item) => {
      const index = item.title.toLowerCase().indexOf(searchValue.toLowerCase());
      const beforeStr = item.title.substr(0, index);
      const afterStr = item.title.substr(index + searchValue.length);
      const matchedStr = item.title.substr(index, searchValue.length);
      const title =
        index > -1 ? (
          <span>
            {beforeStr}
            <strong>
              <span className="site-tree-search-value">{matchedStr}</span>
            </strong>
            {afterStr}
          </span>
        ) : (
          <span>{item.title}</span>
        );
      if (item.children) {
        return { title, key: item.key, children: loop(item.children) };
      }

      return {
        title,
        key: item.key,
      };
    });
  };

  const getNodeData = (id, nodeList) => {
    let res;
    for (const node of nodeList) {
      if (node.key === id) return node;
      else if (node.children && node.children.length) {
        res = getNodeData(id, node.children);
        if (res !== null) return res;
      }
    }
    return null;
  };

  const onNodeSelected = (selected, node) => {
    let type;
    let ret;
    if (selected.length) {
      ret = getNodeData(selected[0], treeContent);
      type = ret.type;
    } else {
      type = null;
      ret = null;
    }
    props.onNodeSelected(type, selected[0]);
  };

  return (
    <div>
      <Search placeholder="Search" onChange={onChange} />
      <Tree
        onSelect={onNodeSelected}
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandedParent}
        treeData={loop(treeContent)}
        selectedKeys={[props.selected]}
      />
    </div>
  );
};

export default MyTree;
