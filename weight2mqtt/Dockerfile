FROM python:latest
WORKDIR /app
COPY requirements.txt .
RUN pip install --default-timeout=10000 --no-cache-dir -r requirements.txt
COPY . /app
ENTRYPOINT ["python", "-u", "weight.py"]