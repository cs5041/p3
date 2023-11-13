FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt
COPY . /app
ENTRYPOINT ["python", "-u", "oled.py"]