package mx.edu.utez.ligamerbackend.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;
import java.util.Map;

public class JsonConverters {
    private static final ObjectMapper mapper = new ObjectMapper();

    @Converter
    public static class StringListConverter implements AttributeConverter<List<String>, String> {
        @Override
        public String convertToDatabaseColumn(List<String> attribute) {
            try {
                return attribute == null ? null : mapper.writeValueAsString(attribute);
            } catch (Exception e) {
                throw new RuntimeException("Error converting list to JSON", e);
            }
        }

        @Override
        public List<String> convertToEntityAttribute(String dbData) {
            try {
                return dbData == null ? null : mapper.readValue(dbData, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                throw new RuntimeException("Error converting JSON to list", e);
            }
        }
    }

    @Converter
    public static class StringMapConverter implements AttributeConverter<Map<String, String>, String> {
        @Override
        public String convertToDatabaseColumn(Map<String, String> attribute) {
            try {
                return attribute == null ? null : mapper.writeValueAsString(attribute);
            } catch (Exception e) {
                throw new RuntimeException("Error converting map to JSON", e);
            }
        }

        @Override
        public Map<String, String> convertToEntityAttribute(String dbData) {
            try {
                return dbData == null ? null : mapper.readValue(dbData, new TypeReference<Map<String, String>>() {});
            } catch (Exception e) {
                throw new RuntimeException("Error converting JSON to map", e);
            }
        }
    }
}
