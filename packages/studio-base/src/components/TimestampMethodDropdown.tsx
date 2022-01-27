// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { AccessTime as AccessTimeIcon, Check as CheckIcon } from "@mui/icons-material";
import { IconButton, IconButtonProps, Menu, MenuItem } from "@mui/material";
import { useCallback, useMemo } from "react";

import * as PanelAPI from "@foxglove/studio-base/PanelAPI";
import {
  messagePathStructures,
  traverseStructure,
  validTerminatingStructureItem,
} from "@foxglove/studio-base/components/MessagePathSyntax/messagePathsForDatatype";
import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { Topic } from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

function topicHasNoHeaderStamp(topic: Topic, datatypes: RosDatatypes): boolean {
  const structureTraversalResult = traverseStructure(
    messagePathStructures(datatypes)[topic.datatype],
    [
      { type: "name", name: "header" },
      { type: "name", name: "stamp" },
    ],
  );

  return (
    !structureTraversalResult.valid ||
    !validTerminatingStructureItem(structureTraversalResult.structureItem, ["time"])
  );
}

type Props = {
  path: string; // A path of the form `/topic.some_field[:]{id==42}.x`
  index?: number; // Optional index field which gets passed to `onChange` (so you don't have to create anonymous functions)
  timestampMethod?: TimestampMethod;
  onTimestampMethodChange?: (arg0: TimestampMethod, index?: number) => void;
} & IconButtonProps;

export default function TimestampMethodDropdown(props: Props): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<undefined | HTMLElement>(undefined);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const { path, timestampMethod = "receiveTime", ...rest } = props;

  const { datatypes, topics } = PanelAPI.useDataSourceInfo();
  const rosPath = useMemo(() => parseRosPath(path), [path]);

  const topic = useMemo(() => {
    if (!rosPath) {
      return undefined;
    }

    const { topicName } = rosPath;
    return topics.find(({ name }) => name === topicName);
  }, [rosPath, topics]);

  const noHeaderStamp = useMemo(() => {
    return topic ? topicHasNoHeaderStamp(topic, datatypes) : false;
  }, [datatypes, topic]);

  const onTimestampMethodChangeProp = props.onTimestampMethodChange;

  const onTimestampMethodChange = useCallback(
    (value: TimestampMethod) => {
      onTimestampMethodChangeProp?.(value, props.index);
    },
    [onTimestampMethodChangeProp, props.index],
  );

  const timestampMethods = [
    { label: "Receive time", value: "recieveTime" },
    { label: "header.stamp", value: "headerStamp" },
  ] as { label: string; value: TimestampMethod }[];

  return (
    <>
      <IconButton
        size="small"
        id="timestamp-method-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{ padding: 0.375, color: "text.secondary", "&:hover": { color: "text.primary" } }}
        {...rest}
      >
        <AccessTimeIcon fontSize="inherit" />
      </IconButton>
      <Menu
        id="timestamp-method-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(undefined)}
        MenuListProps={{
          "aria-labelledby": "timestamp-method-button",
          dense: true,
          disablePadding: true,
        }}
      >
        {timestampMethods.map((method) => (
          <MenuItem
            key={method.value}
            disabled={noHeaderStamp && method.value === "headerStamp"}
            selected={timestampMethod === method.value}
            onClick={() => {
              onTimestampMethodChange(method.value);
              setAnchorEl(undefined);
            }}
          >
            {method.label}
            {timestampMethod === method.value && (
              <CheckIcon fontSize="small" sx={{ marginLeft: 2 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}