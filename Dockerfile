FROM python:3.8-slim-buster
WORKDIR /app
# Install the function's dependencies using file requirements.txt
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

# Copy application
COPY . .
CMD ["python3", "service.py"]
