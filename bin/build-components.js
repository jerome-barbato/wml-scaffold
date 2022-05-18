#!/usr/bin/env node
'use strict';

const { dirname } = require('path');
const appDir = process.env.INIT_CWD;
const wml = require('../index');

const params = require(appDir+'/wml.config.js');

if( params.input )
    params.input = appDir+'/'+params.input;

wml(params).process()
    .catch(function(error) {
        console.log(error);
    });
