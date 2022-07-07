// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Typography } from "@mui/material";

export default function GlobalVariableName({ name }: { name: string }): JSX.Element {
  return (
    <Typography
      variant="inherit"
      component="span"
      color="warning.main"
      maxWidth={100}
      fontWeight={600}
      noWrap
      title={name}
    >
      ${name}
    </Typography>
  );
}
