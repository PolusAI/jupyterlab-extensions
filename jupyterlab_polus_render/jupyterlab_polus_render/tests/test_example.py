#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Akshat Saini, Jeff Chen.
# Distributed under the terms of the Modified BSD License.

import pytest

from ..example import Render


def test_example_creation_blank():
    w = Render()
    assert w.value == 'Hello World'
