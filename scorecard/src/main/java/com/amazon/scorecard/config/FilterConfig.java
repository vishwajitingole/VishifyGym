package com.amazon.scorecard.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.amazon.scorecard.filter.JwtFilter;

@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean<JwtFilter> jwtFilter(JwtFilter jwtFilter) {
        FilterRegistrationBean<JwtFilter> reg = new FilterRegistrationBean<>();
        reg.setFilter(jwtFilter); // ✅ Spring managed
        reg.addUrlPatterns("/users/*");
        return reg;
    }

}
