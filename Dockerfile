FROM tmacro/python:3

ADD ./s6 /etc

# ADD ./requirements.txt /tmp
ADD https://github.com/tmacro/gabcommon/archive/master.zip /tmp/gabcommon.zip
RUN apk add --no-cache --virtual .build-deps \
        build-base \
        python3-dev \
        libffi-dev \
        git && \
    cd /tmp && \
    unzip gabcommon.zip && \
    cd /tmp/gabcommon-master && \
    python setup.py install && \
    cd / && \
    rm -rf /tmp/gabcommon-master /tmp/gabcommon.zip && \
    apk del .build-deps

    # pip install -r /tmp/requirements.txt && \

ADD . /usr/share/app
