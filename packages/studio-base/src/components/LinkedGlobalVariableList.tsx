// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import AddLink from "@mui/icons-material/AddLink";
import { Typography, styled as muiStyled } from "@mui/material";

import GlobalVariableLink from "@foxglove/studio-base/components/GlobalVariableLink";
import { LinkedGlobalVariables } from "@foxglove/studio-base/components/GlobalVariableLink/useLinkedGlobalVariables";
import { getPath } from "@foxglove/studio-base/components/GlobalVariableLink/utils";

const StyledTable = muiStyled("table")`
  border: none;
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;

  th {
    color: ${({ theme }) => theme.palette.text.primary};

    tr:first-of-type & {
      padding-top: 4px;
      padding-bottom: 4px;
    }
  }
  th,
  td {
    border: none;
    vertical-align: middle;
    padding: 0 0.3em;
    line-height: 1.3em;
  }
  tr {
    svg {
      opacity: 0.6;
    }
  }

  tr:hover {
    td {
      background-color: ${({ theme }) => theme.palette.action.hover};
      cursor: pointer;
    }

    svg {
      opacity: 0.8;
    }
  }
`;

type Props = {
  linkedGlobalVariables: LinkedGlobalVariables;
};

export default function LinkedGlobalVariableList({ linkedGlobalVariables }: Props): JSX.Element {
  if (linkedGlobalVariables.length === 0) {
    return (
      <Typography color="text.disabled" variant="body2" gutterBottom>
        Click the <AddLink fontSize="small" />
        icon in the “Selected object” tab to link values with global variables.
      </Typography>
    );
  }
  return (
    <>
      <Typography color="text.disabled" variant="body2" gutterBottom>
        Clicking on objects from these topics will update the linked global variables.
      </Typography>
      <StyledTable>
        <tbody>
          {linkedGlobalVariables.map((linkedGlobalVariable, index) => (
            <tr key={index}>
              <td>
                <GlobalVariableLink linkedGlobalVariable={linkedGlobalVariable} />
              </td>
              <td style={{ wordBreak: "break-all" }}>
                {linkedGlobalVariable.topic}.
                <Typography variant="inherit" component="span" color="text.secondary">
                  {getPath(linkedGlobalVariable.markerKeyPath)}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </>
  );
}
