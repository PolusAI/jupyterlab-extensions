import { IToolbarProps } from './types'
import React, { Component } from 'react';
import { refreshIcon } from '@jupyterlab/ui-components';
import { style } from 'typestyle';

const toolbarStyle = style({
    display: 'flex'
});

const spacer = style({
    flex: '1 1 auto'
  });

// Class for toolbar widget
export class ToolbarWidget extends Component<IToolbarProps> {
    render() {
        return (
            <div className={toolbarStyle}>
                <span className={spacer} />
                <button onClick={this.props.onRefresh}>
                    <refreshIcon.react elementPosition="center" tag="span" />
                </button>
            </div>
        );
    }
}