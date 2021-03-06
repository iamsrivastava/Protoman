import React from 'react';
import { Env, validateNewEnvName } from '../../../models/Env';
import { Button, Row, Col, Input, Divider, Icon, Form, message } from 'antd';
import styled from 'styled-components';
import { Draft } from 'immer';
import { useDispatch, useSelector } from 'react-redux';
import { updateEnv, deleteEnv } from './EnvPickerActions';
import { selectCurrentEnv, selectEnvNames } from '../../../redux/store';
import { AppState } from '../../../models/AppState';

const Wrapper = styled('div')`
  padding: 0;
  margin: 0;
  width: 100%;
  height: 50vh;
  display: flex;
  flex-direction: column;
`;

const KVWrapper = styled('div')`
  padding: 8px;
  width: 100%;
  overflow: auto;
  flex-grow: 99;
`;

const ButtonWrapper = styled('div')`
  padding: 8px 0;
  width: 100%;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
`;

const Title = styled('span')`
  font-size: 16pt;
  margin: 0;
`;

const TitleInput = styled(Input)`
  display: inline;
  font-size: 14pt;
`;

const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
`;

const Spacing = styled('div')`
  flex-grow: 99;
`;

type Props = {
  onCancel: () => void;
};

export const EnvEditor: React.FunctionComponent<Props> = ({ onCancel }) => {
  const dispatch = useDispatch();

  const envNames = useSelector(selectEnvNames);
  const envName = useSelector((s: AppState) => s.currentEnv);
  const env = useSelector(selectCurrentEnv);

  const [isEditingName, setIsEditingName] = React.useState(false);
  const startEditing = (): void => setIsEditingName(true);
  const stopEditing = (): void => setIsEditingName(false);

  const [draft, setDraft] = React.useState<Draft<Env>>({ vars: [] });
  const [draftName, setDraftName] = React.useState('');
  const [isInvalidName, setIsInvalidName] = React.useState(false);

  React.useEffect(() => {
    const draftVars: [string, string][] = [];
    env?.vars?.forEach(([k, v]) => draftVars.push([k, v]));
    setDraft({ vars: draftVars });
  }, [env]);

  React.useEffect(() => {
    setDraftName(envName);
  }, [envName]);

  function updateName(idx: number, newName: string): void {
    draft.vars.splice(idx, 1, [newName, draft.vars[idx][1]]);
    setDraft({ vars: [...draft.vars] });
  }

  function updateValue(idx: number, newValue: string): void {
    draft.vars.splice(idx, 1, [draft.vars[idx][0], newValue]);
    setDraft({ vars: [...draft.vars] });
  }

  function deleteEntry(idx: number): void {
    draft.vars.splice(idx, 1);
    setDraft({ vars: [...draft.vars] });
  }

  function createEntry(): void {
    draft.vars.splice(draft.vars.length, 0, ['', '']);
    setDraft({ vars: [...draft.vars] });
  }

  function checkName(name: string): boolean {
    return validateNewEnvName(name, envNames);
  }

  function handleEnvChange(): void {
    dispatch(updateEnv(envName, draftName, draft));
    onCancel();
  }

  function handleEnvDelete(): void {
    if (envNames.length > 1) {
      dispatch(deleteEnv(envName));
      onCancel();
    } else {
      message.error("Can't delete the last environment");
    }
  }

  return (
    <Wrapper>
      <TitleWrapper>
        {isEditingName ? (
          <Form.Item
            validateStatus={isInvalidName ? 'error' : ''}
            style={{ margin: 0 }}
            help={isInvalidName ? 'Invalid Name' : ''}
          >
            <TitleInput
              value={draftName}
              onChange={(e): void => {
                setIsInvalidName(!checkName(e.target.value));
                setDraftName(e.target.value);
              }}
              onPressEnter={(): void => {
                if (!isInvalidName) {
                  stopEditing();
                }
              }}
            />
          </Form.Item>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Title>{draftName}</Title>
            <div>
              <Button shape="circle" size="small" onClick={startEditing} style={{ marginLeft: 4 }}>
                <Icon type="edit" />
              </Button>
              <Button
                ghost
                shape="circle"
                type="danger"
                size="small"
                onClick={handleEnvDelete}
                style={{ marginLeft: 4 }}
              >
                <Icon type="delete" />
              </Button>
            </div>
          </div>
        )}
      </TitleWrapper>

      <Divider style={{ margin: '8px 0' }} />

      <KVWrapper>
        {draft.vars.map(([k, v], idx) => (
          <SingleEnvVarView
            key={idx}
            name={k}
            value={v}
            onNameChange={(v): void => updateName(idx, v)}
            onValueChange={(v): void => updateValue(idx, v)}
            onDelete={(): void => deleteEntry(idx)}
          />
        ))}
      </KVWrapper>

      <ButtonWrapper>
        <Button
          ghost
          onClick={(): void => {
            if (!isInvalidName) {
              handleEnvChange();
            }
          }}
          type="primary"
        >
          Update
        </Button>
        <Button ghost style={{ marginRight: 4 }} onClick={onCancel} type="danger">
          Cancel
        </Button>
        <Spacing />
        <Button shape="circle" size="small" ghost type="primary" onClick={createEntry}>
          <Icon type="plus" />
        </Button>
      </ButtonWrapper>
    </Wrapper>
  );
};

type SingleProps = {
  name: string;
  value: string;
  onNameChange: (k: string) => void;
  onValueChange: (v: string) => void;
  onDelete: () => void;
};

const SingleEnvVarView: React.FunctionComponent<SingleProps> = ({
  name,
  value,
  onNameChange,
  onValueChange,
  onDelete,
}) => {
  return (
    <Row gutter={8} type="flex" style={{ alignItems: 'center', marginBottom: 8 }}>
      <Col span={6}>
        <Input placeholder="name" value={name} onChange={(e): void => onNameChange(e.target.value)} />
      </Col>
      <Col span={17}>
        <Input placeholder="value" value={value} onChange={(e): void => onValueChange(e.target.value)} />
      </Col>
      <Col span={1}>
        <Button shape="circle" size="small" ghost type="danger" onClick={onDelete}>
          <Icon type="delete" />
        </Button>
      </Col>
    </Row>
  );
};
